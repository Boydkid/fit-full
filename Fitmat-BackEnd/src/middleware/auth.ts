import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { Role } from "@prisma/client";

type TokenPayload = { id?: number; email?: string; role?: string; exp?: number };

declare module "express-serve-static-core" {
  interface Request {
    authUser?: { id?: number; email?: string; role?: string };
  }
}

const extractToken = (req: Request): string | undefined => {
  const header = (req.headers["authorization"] || req.headers["Authorization"]) as string | undefined;
  if (!header) return undefined;
  if (header.startsWith("Bearer ")) return header.slice("Bearer ".length);
  return undefined;
};

export const attachAuthIfPresent = (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = verifyToken<TokenPayload>(token);
    req.authUser = { id: payload?.id, email: payload?.email, role: payload?.role };
  } catch (_e) {
    // ignore invalid token in attachment step; enforced by requireAuth/requireAdmin
  }
  return next();
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: "Missing authorization token." });
  }
  try {
    const payload = verifyToken<TokenPayload>(token);
    req.authUser = { id: payload?.id, email: payload?.email, role: payload?.role };
    return next();
  } catch (_e) {
    return res.status(401).json({ message: "Invalid token." });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: "Missing authorization token." });
  }
  try {
    const payload = verifyToken<TokenPayload>(token);
    if (payload?.role !== Role.ADMIN) {
      return res.status(403).json({ message: "Only admins can perform this action." });
    }
    req.authUser = { id: payload?.id, email: payload?.email, role: payload?.role };
    return next();
  } catch (_e) {
    return res.status(401).json({ message: "Invalid token." });
  }
};



