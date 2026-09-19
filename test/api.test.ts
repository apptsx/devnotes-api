import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();
const PASSWORD = "correct-horse-battery";

let token = "";
let otherToken = "";

async function signup(email: string) {
  const res = await request(app)
    .post("/api/auth/signup")
    .send({ email, password: PASSWORD });
  expect(res.status).toBe(201);
  return res.body.data.token as string;
}

describe("DevNotes API", () => {
  beforeAll(async () => {
    token = await signup("user@example.com");
    otherToken = await signup("other@example.com");
  });

  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("rejects invalid signup payloads", async () => {
    const invalidEmail = await request(app)
      .post("/api/auth/signup")
      .send({ email: "not-an-email", password: "12345678" });
    expect(invalidEmail.status).toBe(400);

    const shortPassword = await request(app)
      .post("/api/auth/signup")
      .send({ email: "a@b.com", password: "short" });
    expect(shortPassword.status).toBe(400);
  });

  it("rejects duplicate email", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: "user@example.com", password: PASSWORD });
    expect(res.status).toBe(409);
  });

  it("rejects login with wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@example.com", password: "wrong-password" });
    expect(res.status).toBe(401);
  });

  it("logs in and returns a token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@example.com", password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
  });

  it("requires auth for notes", async () => {
    const missing = await request(app).get("/api/notes");
    expect(missing.status).toBe(401);

    const invalid = await request(app)
      .get("/api/notes")
      .set("Authorization", "Bearer not-a-token");
    expect(invalid.status).toBe(401);
  });

  it("creates a note", async () => {
    const res = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "First note", body: "Hello world" });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe("First note");
    expect(res.body.data.userId).toBeGreaterThan(0);
  });

  it("rejects invalid note payload", async () => {
    const res = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "" });
    expect(res.status).toBe(400);
  });

  it("paginates the note list", async () => {
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post("/api/notes")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: `Note ${i}`, body: "x" });
    }

    const res = await request(app)
      .get("/api/notes?page=1&limit=2")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(4);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(2);
    expect(res.body.meta.totalPages).toBeGreaterThanOrEqual(2);
  });

  it("does not expose another user's note", async () => {
    const mine = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Secret", body: "hidden" });
    const id = mine.body.data.id as number;

    const res = await request(app)
      .get(`/api/notes/${id}`)
      .set("Authorization", `Bearer ${otherToken}`);
    expect(res.status).toBe(404);
  });

  it("updates and deletes a note", async () => {
    const created = await request(app)
      .post("/api/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Temporary", body: "will update" });
    const id = created.body.data.id as number;

    const updated = await request(app)
      .put(`/api/notes/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Renamed", body: "updated body" });
    expect(updated.status).toBe(200);
    expect(updated.body.data.title).toBe("Renamed");
    expect(updated.body.data.body).toBe("updated body");

    const deleted = await request(app)
      .delete(`/api/notes/${id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(deleted.status).toBe(204);

    const gone = await request(app)
      .get(`/api/notes/${id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(gone.status).toBe(404);
  });
});