import dotenv from "dotenv";

dotenv.config();

// Required environment variables
const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET", "PORT"];

// Optional environment variables with defaults
const optionalEnvVars = {
  NODE_ENV: "development",
  JWT_EXPIRE: "30d",
  CORS_ORIGIN: "*",
};

/**
 * Validate that all required environment variables are present
 * @throws {Error} If any required variable is missing
 */
export const validateEnv = () => {
  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        `Please check your .env file and ensure all required variables are set.`
    );
  }

  // Set defaults for optional variables
  Object.entries(optionalEnvVars).forEach(([key, defaultValue]) => {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
    }
  });
};

/**
 * Get environment configuration
 */
export const getEnvConfig = () => {
  return {
    mongodb: {
      uri: process.env.MONGODB_URI,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expire: process.env.JWT_EXPIRE || "30d",
    },
    server: {
      port: parseInt(process.env.PORT || "5000", 10),
      nodeEnv: process.env.NODE_ENV || "development",
      corsOrigin: process.env.CORS_ORIGIN || "*",
    },
    isDevelopment: process.env.NODE_ENV !== "production",
    isProduction: process.env.NODE_ENV === "production",
  };
};
