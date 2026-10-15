'use strict';

const AppError = require('../utils/AppError');

/**
 * Validates req[source] against a zod schema and replaces it with the parsed
 * (sanitised, defaulted) value. Unknown keys are stripped by the schemas.
 */
function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      const fields = result.error.issues.map((i) => ({ field: i.path.join('.') || source, message: i.message }));
      return next(AppError.badRequest(fields[0]?.message || 'Invalid input.', { fields }));
    }
    if (source === 'query') req.validatedQuery = result.data;
    else req[source] = result.data;
    return next();
  };
}

module.exports = { validate };
