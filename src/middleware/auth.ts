import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../auth.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  const userId = verifyToken(header.slice(7));
  if (!userId) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  res.locals.userId = userId;
  next();
}