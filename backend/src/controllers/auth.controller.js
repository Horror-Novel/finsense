const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const DEFAULT_CATEGORIES = [
  { name: "Food", icon: "🍔" },
  { name: "Transport", icon: "🚗" },
  { name: "Shopping", icon: "🛍️" },
  { name: "Bills", icon: "🧾" },
  { name: "Other", icon: "💰" },
];

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function toPublicUser(user) {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

// POST /api/auth/signup
const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, "An account with this email already exists");
  }

  // Passwords are NEVER stored in plaintext — bcrypt hashes with a salt
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  // Seed a few default categories for a smoother first-run demo
  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((c) => ({ ...c, userId: user.id })),
  });

  const token = signToken(user);
  res.status(201).json({ success: true, token, user: toPublicUser(user) });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signToken(user);
  res.status(200).json({ success: true, token, user: toPublicUser(user) });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw new ApiError(404, "User not found");
  res.status(200).json({ success: true, user: toPublicUser(user) });
});

// POST /api/auth/google
// OAuth / third-party login via Google Identity Services. The frontend's
// Google Sign-In button hands us a signed ID token ("credential"); we
// verify it directly with Google's own library (never trusting the
// frontend's word for who the user is), then find-or-create the account.
// Body: { credential: string }
const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  if (!credential) throw new ApiError(400, "Missing Google credential");
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new ApiError(500, "Google OAuth is not configured on this server");
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    throw new ApiError(401, "Invalid or expired Google credential");
  }

  if (!payload?.email) {
    throw new ApiError(401, "Google account has no verified email");
  }

  let user = await prisma.user.findUnique({ where: { email: payload.email } });

  if (!user) {
    // New Google sign-in — create an account. This user will always
    // authenticate via Google, so we store a random, never-shared,
    // never-usable-for-login bcrypt hash just to satisfy the schema's
    // NOT NULL constraint on passwordHash — it can never be used to log
    // in via the normal email/password form since nobody knows it.
    const randomSecret = crypto.randomBytes(32).toString("hex");
    const passwordHash = await bcrypt.hash(randomSecret, 10);

    user = await prisma.user.create({
      data: {
        name: payload.name || payload.email.split("@")[0],
        email: payload.email,
        passwordHash,
      },
    });

    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({ ...c, userId: user.id })),
    });
  }

  const token = signToken(user);
  res.status(200).json({ success: true, token, user: toPublicUser(user) });
});

module.exports = { signup, login, getMe, googleLogin };
