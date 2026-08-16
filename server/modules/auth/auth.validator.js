// auth.validator.js
const Joi = require("joi");

const authValidation = {
  register: {
    body: Joi.object({
      email: Joi.string().email().required().max(255),
      password: Joi.string()
        .min(8)
        .max(100)
        .pattern(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        )
        .required()
        .messages({
          "string.pattern.base":
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        }),
      fullName: Joi.string().max(255).required(),
      plan: Joi.string()
        .valid("free", "pro", "business", "enterprise")
        .default("free"),
    }),
  },

  login: {
    body: Joi.object({
      email: Joi.string().email().required().max(255),
      password: Joi.string().required(),
      rememberMe: Joi.boolean().default(false),
    }),
  },

  refreshToken: {
    body: Joi.object({
      refreshToken: Joi.string().required(),
    }),
  },

  resetPasswordRequest: {
    body: Joi.object({
      email: Joi.string().email().required().max(255),
    }),
  },

  resetPassword: {
    body: Joi.object({
      token: Joi.string().required(),
      newPassword: Joi.string()
        .min(8)
        .max(100)
        .pattern(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        )
        .required()
        .messages({
          "string.pattern.base":
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        }),
      confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
    }),
  },

  verifyEmail: {
    params: Joi.object({
      token: Joi.string().required(),
    }),
  },

  logout: {
    body: Joi.object({
      refreshToken: Joi.string().optional(),
    }),
  },

  changePassword: {
    body: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string()
        .min(8)
        .max(100)
        .pattern(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        )
        .required()
        .messages({
          "string.pattern.base":
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
        }),
      confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
    }),
  },
};

module.exports = authValidation;
