import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import {
  createNote,
  deleteNote,
  getNote,
  listNotes,
  updateNote,
} from "../db.js";

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  title: z.string().min(1).max(140),
  body: z.string().max(5000).optional().default(""),
});

const updateSchema = z.object({
  title: z.string().min(1).max(140).optional(),
  body: z.string().max(5000).optional(),
});

function parsePagination(query: Record<string, unknown>) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit };
}

router.get("/", (req, res) => {
  const { page, limit } = parsePagination(req.query as Record<string, unknown>);
  const { items, total } = listNotes(res.locals.userId, page, limit);
  res.json({
    data: items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

router.post("/", (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const note = createNote(res.locals.userId, parsed.data.title, parsed.data.body);
  return res.status(201).json({ data: note });
});

router.get("/:id", (req, res) => {
  const note = getNote(Number(req.params.id));
  if (!note || note.userId !== res.locals.userId) {
    return res.status(404).json({ error: "Note not found" });
  }
  return res.json({ data: note });
});

router.put("/:id", (req, res) => {
  const note = getNote(Number(req.params.id));
  if (!note || note.userId !== res.locals.userId) {
    return res.status(404).json({ error: "Note not found" });
  }

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const updated = updateNote(note.id, parsed.data);
  if (!updated) {
    return res.status(404).json({ error: "Note not found" });
  }
  return res.json({ data: updated });
});

router.delete("/:id", (req, res) => {
  const note = getNote(Number(req.params.id));
  if (!note || note.userId !== res.locals.userId) {
    return res.status(404).json({ error: "Note not found" });
  }

  deleteNote(note.id);
  return res.status(204).end();
});

export default router;