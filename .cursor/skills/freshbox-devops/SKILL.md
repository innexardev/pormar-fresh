---
name: freshbox-devops
description: Configures Fresh Box Docker, env vars, migrations, and local dev. Use for docker-compose, DATABASE_URL, deploy checklist.
---

# Fresh Box DevOps

## Local stack

```bash
docker compose up -d   # postgres :5433, redis :6380
npm run db:generate
cd apps/api && npx prisma migrate dev && npm run prisma:seed
npm run dev
```

## Ports

- API 3010, Web 3020, Admin 3021, Postgres 5433

## Never

Commit `.env` or secrets.

Referencia: `README.md`, `docker-compose.yml`.
