/**
 * Returns an Express middleware that validates req[source] against a Joi schema.
 * On failure: responds 400 with an array of error messages.
 * On success: replaces req[source] with the validated (and defaulted) value.
 */
function validate(schema, source = "body") {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((d) => d.message),
      });
    }

    req[source] = value;
    next();
  };
}

module.exports = validate;
