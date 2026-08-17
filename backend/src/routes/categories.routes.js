const express = require("express");
const {
  getCategories,
  createCategory,
  deleteCategory,
} = require("../controllers/categories.controller");
const { requireAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createCategorySchema } = require("../validators/transaction.validator");

const router = express.Router();

router.use(requireAuth); // every route below requires a logged-in user

router.get("/", getCategories);
router.post("/", validate(createCategorySchema), createCategory);
router.delete("/:id", deleteCategory);

module.exports = router;
