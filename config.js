import dotenv from "dotenv";

dotenv.config();

// Env Config
const MONGODB_URL = process.env.MONGODB_URL || "mongodb://localhost:27017";
const APP_PORT = process.env.APP_PORT || 3000;
// Export Env Config{};
export {
    MONGODB_URL,
    APP_PORT
}
