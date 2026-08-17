const { signupSchema, loginSchema } = require("../../src/validators/auth.validator");
const {
  createTransactionSchema,
  createCategorySchema,
} = require("../../src/validators/transaction.validator");

describe("signupSchema", () => {
  const valid = { name: "Karti", email: "k@test.com", password: "secret1" };

  it("accepts valid signup data", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects name shorter than 2 chars", () => {
    expect(signupSchema.safeParse({ ...valid, name: "A" }).success).toBe(false);
  });
  it("rejects invalid email", () => {
    expect(signupSchema.safeParse({ ...valid, email: "notanemail" }).success).toBe(false);
  });
  it("rejects password shorter than 6 chars", () => {
    expect(signupSchema.safeParse({ ...valid, password: "abc" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid login data", () => {
    expect(loginSchema.safeParse({ email: "k@test.com", password: "any" }).success).toBe(true);
  });
  it("rejects missing password", () => {
    expect(loginSchema.safeParse({ email: "k@test.com", password: "" }).success).toBe(false);
  });
});

describe("createTransactionSchema", () => {
  const valid = { description: "Swiggy order", amount: "450" };

  it("accepts valid transaction data", () => {
    expect(createTransactionSchema.safeParse(valid).success).toBe(true);
  });
  it("coerces amount string to number", () => {
    const r = createTransactionSchema.safeParse(valid);
    expect(r.data.amount).toBe(450);
  });
  it("rejects zero amount", () => {
    expect(createTransactionSchema.safeParse({ ...valid, amount: "0" }).success).toBe(false);
  });
  it("rejects negative amount", () => {
    expect(createTransactionSchema.safeParse({ ...valid, amount: "-50" }).success).toBe(false);
  });
  it("rejects description shorter than 2 chars", () => {
    expect(createTransactionSchema.safeParse({ ...valid, description: "A" }).success).toBe(false);
  });
  it("accepts optional categoryId as string and coerces to number", () => {
    const r = createTransactionSchema.safeParse({ ...valid, categoryId: "3" });
    expect(r.success).toBe(true);
    expect(r.data.categoryId).toBe(3);
  });
});

describe("createCategorySchema", () => {
  it("accepts valid category", () => {
    expect(createCategorySchema.safeParse({ name: "Food" }).success).toBe(true);
  });
  it("rejects name shorter than 2 chars", () => {
    expect(createCategorySchema.safeParse({ name: "F" }).success).toBe(false);
  });
});
