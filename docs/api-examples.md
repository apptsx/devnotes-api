# API examples

## Register a user

```
POST /api/auth/register
Content-Type: application/json

{ "username": "alice", "email": "alice@example.com", "password": "s3cret" }
```

## Create a note

```
POST /api/notes
Authorization: Bearer <token>
Content-Type: application/json

{ "title": "DevNotes API", "content": "Notes with JWT auth." }
```

## List notes

```
GET /api/notes?page=1&limit=20
Authorization: Bearer <token>
```

For the full contract see `openapi.yaml`.