import jwt, { SignOptions } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "mysecretkey";

export const generateToken = (
  payload: object,
  options: SignOptions = { expiresIn: "1h" }
): string => {
  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = <T>(token: string): T => {
  return jwt.verify(token, JWT_SECRET) as T;
};

export const getJwtSecret = () => JWT_SECRET;
