const express = require("express");
const { signup, login, getMe, googleLogin } = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth");
const { authRateLimiter } = require("../middleware/rateLimiter");
const validate = require("../middleware/validate");
const { signupSchema, loginSchema } = require("../validators/auth.validator");

const router = express.Router();

router.post("/signup", authRateLimiter, validate(signupSchema), signup);
router.post("/login", authRateLimiter, validate(loginSchema), login);
router.post("/google", authRateLimiter, googleLogin);
router.get("/me", requireAuth, getMe);

module.exports = router;
