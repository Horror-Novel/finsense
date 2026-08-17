const { z } = require("zod");

// NOTE: transaction creation is submitted as multipart/form-data (since it
// may include an optional receipt image via Multer), which means every
// field arrives as a string. z.coerce / a boolean-string preprocess handles
// converting "450" -> 450 and "true" -> true before validation runs.
const booleanString = z.preprocess((val) => val === "true" || val === true, z.boolean());
// Treats "" / undefined as "field not provided" before the real schema runs
const emptyToUndefined = (val) => (val === "" || val === undefined ? undefined : val);

const createTransactionSchema = z.object({
  description: z.string().trim().min(2, "Description is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  merchant: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  categoryId: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
  spentAt: z.preprocess(emptyToUndefined, z.string().optional()),
  autoCategrize: booleanString.optional(), // if true, backend calls the LLM
});

const updateTransactionSchema = createTransactionSchema.partial();

const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Category name is required"),
  icon: z.string().trim().optional(),
});

module.exports = {
  createTransactionSchema,
  updateTransactionSchema,
  createCategorySchema,
};
