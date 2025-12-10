import mongoose from "mongoose";

/**
 * Validate if string is a valid MongoDB ObjectId
 */
export const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Middleware to validate ObjectId parameter
 */
export const validateObjectId = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName}: "${id}". Must be a valid MongoDB ObjectId.`,
      });
    }

    next();
  };
};

/**
 * Middleware to validate multiple ObjectId parameters
 */
export const validateMultipleObjectIds = (...paramNames) => {
  return (req, res, next) => {
    for (const paramName of paramNames) {
      const id = req.params[paramName];

      if (id && !isValidObjectId(id)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${paramName}: "${id}". Must be a valid MongoDB ObjectId.`,
        });
      }
    }

    next();
  };
};

/**
 * Middleware to validate request body fields
 */
export const validateRequiredFields = (fields) => {
  return (req, res, next) => {
    const missingFields = fields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    next();
  };
};
