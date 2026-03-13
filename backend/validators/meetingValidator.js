const Joi = require("joi");

const listMeetingsSchema = Joi.object({
  type: Joi.string().valid("scheduled", "upcoming", "live").default("scheduled"),
});

const createMeetingSchema = Joi.object({
  topic: Joi.string().trim().min(1).max(200).required().messages({
    "string.empty": "Meeting topic is required",
    "string.max": "Topic must be 200 characters or fewer",
  }),
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      "string.pattern.base": "Date must be in YYYY-MM-DD format",
      "any.required": "Meeting date is required",
    }),
  time: Joi.string()
    .pattern(/^\d{2}:\d{2}$/)
    .required()
    .messages({
      "string.pattern.base": "Time must be in HH:MM format",
      "any.required": "Meeting time is required",
    }),
  duration: Joi.number().integer().min(15).max(300).default(60).messages({
    "number.min": "Duration must be at least 15 minutes",
    "number.max": "Duration cannot exceed 300 minutes",
  }),
  timezone: Joi.string().max(100).default("UTC"),
});

module.exports = { listMeetingsSchema, createMeetingSchema };
