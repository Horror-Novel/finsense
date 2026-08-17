const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");

// GET /api/categories
const getCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { userId: req.user.id },
    orderBy: { name: "asc" },
  });
  res.status(200).json({ success: true, data: categories });
});

// POST /api/categories
const createCategory = asyncHandler(async (req, res) => {
  const { name, icon } = req.body;
  const category = await prisma.category.create({
    data: { name, icon: icon || "💰", userId: req.user.id },
  });
  res.status(201).json({ success: true, data: category });
});

// DELETE /api/categories/:id
const deleteCategory = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category || category.userId !== req.user.id) {
    throw new ApiError(404, "Category not found");
  }

  await prisma.category.delete({ where: { id } });
  res.status(200).json({ success: true, message: "Category deleted" });
});

module.exports = { getCategories, createCategory, deleteCategory };
