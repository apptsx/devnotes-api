<div align="center">

# DevNotes API

A secure REST API for personal notes — JWT authentication, pass-based and bcrypt-free: passwords use **scrypt**; data lives in **SQLite** (built-in `node:sqlite`, zero native deps).

![Node](https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-0ea5e9?style=for-the-badge&logo=sqlite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

[![CI](https://github.com/apptsx/devnotes-api/actions/workflows/ci.yml/badge.svg)](https://github.com/apptsx/devnotes-api/actions/workflows/ci.yml)

</div>

## Features

- ✅ Sign up / login with **JWT** (7-day expiry)
- ✅ Passwords hashed with **scrypt** (salt + timing-safe compare)
- ✅ Note CRUD scoped to the authenticated user
- ✅ Pagination (`page`, `limit`) with metadata
- ✅ Request validation with **Zod**
- ✅ Full integration tests (Vitest + Supertest)
- ✅ Docker and GitHub Actions CI

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

## Endpoints

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | — | Health check |
| `POST` | `/api/auth/signup` | — | Register — `{ "email", "password" }` |
| `POST` | `/api/auth/login` | — | Login — returns `{ token }` |
| `GET` | `/api/notes?page=1&limit=20` | Bearer | List own notes (paginated) |
| `POST` | `/api/notes` | Bearer | Create note — `{ "title", "body"? }` |
| `GET` | `/api/notes/:id` | Bearer | Get own note |
| `PUT` | `/api/notes/:id` | Bearer | Update own note |
| `DELETE` | `/api/notes/:id` | Bearer | Delete own note |

## Example

```bash
# sign up
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"me@example.com","password":"s3cret-pass"}'

# login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"me@example.com","password":"s3cret-pass"}' | jq -r .data.token)

# create a note
curl -X POST http://localhost:3000/api/notes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Ideas","body":"Write more code"}'

# paginated list
curl "http://localhost:3000/api/notes?page=1&limit=5" -H "Authorization: Bearer $TOKEN"
```

## Configuration

| Env var | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port |
| `DATABASE_PATH` | `:memory:` | SQLite file path |
| `JWT_SECRET` | `dev-secret-only` | Signing secret — **set in production** |

## Project structure

```
devnotes-api/
├── src/
│   ├── app.ts             # Express app factory
│   ├── index.ts           # HTTP bootstrap
│   ├── auth.ts            # scrypt hashing + JWT helpers
│   ├── db.ts              # SQLite adapter (node:sqlite)
│   ├── middleware/auth.ts # Bearer token guard
│   └── routes/            # auth + notes routers
├── test/                  # integration tests
├── .github/workflows/ci.yml
└── Dockerfile
```

## Tests

```bash
npm test
```

## License

MIT