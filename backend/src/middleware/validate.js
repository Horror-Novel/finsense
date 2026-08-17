const ApiError = require("../utils/apiError");

// Generic middleware factory: pass it a Zod schema and it will validate
// req.body against it, returning a clean 400 with field-level details
// on failure instead of letting bad data reach the controller/DB.
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      return next(new ApiError(400, "Validation failed", details));
    }
    req.body = result.data; // use the parsed/typed data
    next();
  };
}

module.exports = validate;
