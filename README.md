# Movie Watchlist

A full-stack web application for tracking movies and writing reviews. Users can manage a personal watchlist across three statuses — **want to watch**, **watching**, and **watched** — and leave a rating and review for any film they have seen.

## Features

- Register and log in with JWT-based authentication
- Browse the movie catalog with genre filtering
- Add movies to your watchlist and update their status
- Write a review (1–5 stars + comment) for watched movies
- View your profile with watch statistics

## Tech stack

**Backend** — NestJS 11 · TypeScript (strict) · TypeORM · PostgreSQL 16 · JWT auth · Swagger  
**Frontend** — React 19 · Vite · TypeScript · Tailwind CSS v4 · Zustand · `openapi-fetch`  
**Infrastructure** — Docker Compose

---

## Getting started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose (recommended)
- Node.js LTS — only needed for running services outside Docker

### 1. Clone and configure

```bash
git clone <repo-url>
cd movie-watchlist

cp backend/.env.example backend/.env
cp infra/.env.example infra/.env
```

Open `backend/.env` and `infra/.env` and set values for:

| Variable | Notes |
|---|---|
| `DB_NAME`, `DB_USER`, `DB_PASS` | Must be identical in both files — the backend connects to the container Postgres creates with these credentials |
| `JWT_SECRET` | Any long random string |

### 2. Start everything

```bash
docker compose -f infra/docker-compose.yml up -d
```

Database migrations run automatically when the backend starts.

| Service | URL |
|---|---|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:3000 |
| Swagger (interactive docs) | http://localhost:3000/api-docs |

### 3. Stop

```bash
# Keep database data
docker compose -f infra/docker-compose.yml down

# Wipe everything including the database
docker compose -f infra/docker-compose.yml down -v
```

---

## Project structure

```
movie-watchlist/
├── backend/             # NestJS API  →  see backend/README.md
│   └── src/
│       ├── modules/         # auth, users, movies, watchlist, reviews
│       ├── common/          # decorators, guards, filters, interceptors
│       ├── config/          # typed config + Joi startup validation
│       └── database/        # data source, migrations
├── frontend/            # React SPA   →  see frontend/README.md
│   └── src/
│       ├── api/             # generated schema + typed fetch client
│       ├── components/      # shared UI components
│       ├── pages/           # route-level page components
│       └── stores/          # Zustand state (auth, watchlist)
└── infra/
    └── docker-compose.yml
```

For implementation details, conventions, and how to contribute to each part:

- [backend/README.md](backend/README.md) — module structure, authorization pattern, migrations, testing
- [frontend/README.md](frontend/README.md) — API client, state management, routing, components

---

## Local development (without Docker)

You will need a running PostgreSQL instance. Set `DB_HOST=localhost` in `backend/.env`.

**Backend**
```bash
cd backend && npm install && npm run start:dev
# starts on :3000 — migrations run automatically
```

**Frontend**
```bash
cd frontend && npm install && npm run dev
# starts on :3001
```

---

## Data model

```
User            (id, email, passwordHash, name, createdAt)
Movie           (id, title, genre, releaseYear, description, posterUrl)
WatchlistEntry  (id, userId, movieId, status, createdAt, updatedAt)
                  status: 'want' | 'watching' | 'watched'
                  UNIQUE(userId, movieId)
Review          (id, userId, movieId, rating, comment, createdAt, updatedAt)
                  rating: 1..5
                  UNIQUE(userId, movieId)
```

## Business rules

1. A user can only review movies they have marked as **watched**.
2. A user has a single review per movie.
3. A user can only modify or delete their own watchlist entries and reviews.
4. The movie catalog is global and read-only from the API.
5. Profile statistics (total watched, average rating) are computed live from the database.

---

## AI Workflow

For AI Workflow details check [AI_WORKFLOW.md](AI_WORKFLOW.md)