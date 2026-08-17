const express = require("express");
const { getDigests, runDigestNow } = require("../controllers/digests.controller");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", getDigests);
router.post("/run-now", runDigestNow);

module.exports = router;
