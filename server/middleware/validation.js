import { BadRequestError } from "../errors/customErrors.js";
export const validationMiddleware = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const details = error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        }));

        throw new BadRequestError("Validation failed", details);
      }

      req.body = value;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Query validation middleware
export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.query, {
        abortEarly: false,
      });

      if (error) {
        const details = error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        }));

        throw new BadRequestError("Invalid query parameters", details);
      }

      req.query = value;
      next();
    } catch (error) {
      next(error);
    }
  };
};
