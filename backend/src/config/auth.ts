import dotenv from "dotenv";

dotenv.config();

export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || "peoplepay360-hackathon-jwt-secret-key",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  saltRounds: 10,
};

export default authConfig;
