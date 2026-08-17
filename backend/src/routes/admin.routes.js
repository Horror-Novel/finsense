const express = require("express");
const { getStats, updateUserRole } = require("../controllers/admin.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// ROLE-BASED AUTHORIZATION IN ACTION:
// Every route below is protected by TWO middleware layers:
//   1. requireAuth  — rejects requests with no/invalid JWT (401)
//   2. requireRole("ADMIN") — rejects authenticated users whose role isn't ADMIN (403)
//
// A normal USER with a valid JWT hitting GET /api/admin/stats gets:
//   HTTP 403 { message: "You do not have permission to perform this action" }
// An ADMIN with a valid JWT gets the actual data.
//
// To test this in a viva:
//   1. Log in as a normal user → copy the JWT from localStorage
//   2. curl http://localhost:5000/api/admin/stats -H "Authorization: Bearer <token>"
//      → 403 Forbidden
//   3. In psql: UPDATE users SET role='ADMIN' WHERE email='your@email.com';
//   4. Log in again → try the same curl → 200 with real data
router.use(requireAuth);
router.use(requireRole("ADMIN")); // ← THIS is the role-based authorization check

router.get("/stats", getStats);
router.patch("/users/:id/role", updateUserRole);

module.exports = router;
