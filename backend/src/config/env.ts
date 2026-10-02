import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "dev_only_change_me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  mlServiceUrl: process.env.ML_SERVICE_URL || "http://localhost:8000",
  optimizationServiceUrl: process.env.OPTIMIZATION_SERVICE_URL || "http://localhost:8001"
};