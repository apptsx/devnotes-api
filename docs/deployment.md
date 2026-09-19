# Deployment

The API ships as a self-contained Docker image.

```
docker compose up -d --build
```

## Environment

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `PORT` | no | `3000` | HTTP listen port |
| `DB_PATH` | no | `./data.db` | SQLite database file |
| `JWT_SECRET` | yes | — | Secret used to sign tokens |

## Data persistence

The SQLite file lives under `data/` and is mounted as a volume so data survives
container restarts.