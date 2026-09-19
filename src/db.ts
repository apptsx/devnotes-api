import { createRequire } from "node:module";

type SqliteModule = typeof import("node:sqlite");
const require = createRequire(import.meta.url);
const { DatabaseSync } = require("node:sqlite") as SqliteModule;

export type User = {
  id: number;
  email: string;
  passwordHash: string;
};

export type Note = {
  id: number;
  userId: number;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

const db = new DatabaseSync(process.env.DATABASE_PATH ?? ":memory:");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

type UserRow = {
  id: number;
  email: string;
  password_hash: string;
  created_at: string;
};

type NoteRow = {
  id: number;
  user_id: number;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
};

const userFromRow = (row: UserRow): User => ({
  id: row.id,
  email: row.email,
  passwordHash: row.password_hash,
});

const noteFromRow = (row: NoteRow): Note => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  body: row.body,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function findUserByEmail(email: string): User | undefined {
  const row = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email) as unknown as UserRow | undefined;
  return row ? userFromRow(row) : undefined;
}

export function findUserById(id: number): User | undefined {
  const row = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(id) as unknown as UserRow | undefined;
  return row ? userFromRow(row) : undefined;
}

export function createUser(email: string, passwordHash: string): User {
  const result = db
    .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
    .run(email, passwordHash);
  const user = findUserById(Number(result.lastInsertRowid));
  if (!user) throw new Error("Failed to create user");
  return user;
}

export function createNote(userId: number, title: string, body: string): Note {
  const result = db
    .prepare("INSERT INTO notes (user_id, title, body) VALUES (?, ?, ?)")
    .run(userId, title, body);
  const row = db
    .prepare("SELECT * FROM notes WHERE id = ?")
    .get(Number(result.lastInsertRowid)) as unknown as NoteRow;
  return noteFromRow(row);
}

export function listNotes(
  userId: number,
  page: number,
  limit: number,
): { items: Note[]; total: number } {
  const offset = (page - 1) * limit;
  const countRow = db
    .prepare("SELECT COUNT(*) AS c FROM notes WHERE user_id = ?")
    .get(userId) as unknown as { c: number };
  const rows = db
    .prepare(
      "SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC, id DESC LIMIT ? OFFSET ?",
    )
    .all(userId, limit, offset) as unknown as NoteRow[];
  return { items: rows.map(noteFromRow), total: Number(countRow.c) };
}

export function getNote(id: number): Note | undefined {
  const row = db
    .prepare("SELECT * FROM notes WHERE id = ?")
    .get(id) as unknown as NoteRow | undefined;
  return row ? noteFromRow(row) : undefined;
}

export function updateNote(
  id: number,
  patch: { title?: string; body?: string },
): Note | undefined {
  const existing = getNote(id);
  if (!existing) return undefined;

  const title = patch.title ?? existing.title;
  const body = patch.body ?? existing.body;
  db.prepare(
    "UPDATE notes SET title = ?, body = ?, updated_at = datetime('now') WHERE id = ?",
  ).run(title, body, id);
  return getNote(id);
}

export function deleteNote(id: number): boolean {
  const result = db.prepare("DELETE FROM notes WHERE id = ?").run(id);
  return Number(result.changes) > 0;
}