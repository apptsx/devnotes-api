import { Router } from "express";
import { z } from "zod";
import { createUser, findUserByEmail } from "../db.js";
import { hashPassword, signToken, verifyPassword } from "../auth.js";

const router = Router();

const signupSchema = z.object({
  email: z.string().email().max(160),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.string().email().max(160),
  password: z.string().min(1).max(72),
});

router.post("/signup", (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;
  if (findUserByEmail(email)) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const user = createUser(email, hashPassword(password));
  return res.status(201).json({
    data: { id: user.id, email: user.email, token: signToken(user.id) },
  });
});

router.post("/login", (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;
  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  return res.json({
    data: { id: user.id, email: user.email, token: signToken(user.id) },
  });
});

export default router;