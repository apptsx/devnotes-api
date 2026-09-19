# Development guide

## Prerequisites

* Node.js 20+ (`node:sqlite` is required)
* npm 10+

## Setup

```
npm install
npm test          # runs Vitest suite
npm run dev       # starts the API with watch mode
```

## Project layout

```
src/
  app.ts       # Express app factory (skinnable by tests)
  server.ts    # entrypoint: starts the HTTP server
  routes/      # auth + notes routers
  lib/         # db, jwt, validation helpers
```

## Conventions

* Handlers stay thin; logic lives in `lib/`.
* JWT secret is read from `JWT_SECRET` — never hard-code it.