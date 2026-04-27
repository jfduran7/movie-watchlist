# Frontend

React + Vite + TypeScript SPA for Movie Watchlist. Communicates with the backend via a typed API client generated from the OpenAPI spec.

> **New here?** Start with the [root README](../README.md) to get the project running first.

## Architecture overview

```
pages/ → stores/ (Zustand) → api/client.ts → Backend API
              ↑
         components/
```

- **Pages** are route-level components. They read state from stores and call API functions directly.
- **Stores** (Zustand) hold auth state and the watchlist. They are the single source of truth for shared state.
- **API client** (`src/api/client.ts`) is the only place that talks to the backend. All fetch calls go through it.
- **Components** are UI building blocks with no knowledge of the API or stores.

## Type-safe API client

**The frontend never defines API types by hand.** They are generated from the backend's OpenAPI spec.

```bash
# Backend must be running on :3000
npm run generate:api
# → writes src/api/schema.d.ts
```

`schema.d.ts` is committed so the frontend builds even when the backend is offline. Regenerate it and commit the updated file alongside any backend contract change.

The client (`src/api/client.ts`) exposes grouped helpers that call the backend and unwrap the response envelope:

```typescript
import { moviesApi, watchlistApi, reviewsApi, authApi, profileApi } from '@/api/client';

// all calls return the unwrapped data; errors throw
const res = await moviesApi.list({ genre: 'Drama', page: 1 });
const movies = res.data;     // Movie[]
const total  = res.meta.total;

const detail = await moviesApi.getById(id);
const movie  = detail.data;  // Movie
```

Error handling: failed requests throw an `Error` with `.status` (HTTP status code) and `.body` (parsed JSON) attached.

## State management

Two Zustand stores:

### `useAuthStore` (`src/stores/authStore.ts`)

| State | Type | Description |
|---|---|---|
| `isAuthenticated` | `boolean` | Whether a valid token exists in localStorage |
| `token` | `string \| null` | Raw JWT |
| `userId` | `string \| null` | Decoded from JWT payload (`sub`) |
| `isLoading` | `boolean` | In-flight auth request |
| `error` | `string \| null` | Last auth error message |

Actions: `login`, `register`, `logout`, `clearError`.

The token is persisted to `localStorage` and rehydrated on page load.

### `useWatchlistStore` (`src/stores/watchlistStore.ts`)

Holds the current user's watchlist entries. Used by the Watchlist page and movie detail page to reflect current status and allow updates without a full page reload.

## Routing

Routes are defined in `src/App.tsx` using React Router v7.

| Path | Page | Auth required |
|---|---|---|
| `/login` | `LoginPage` | No (redirects to `/movies` if already authed) |
| `/register` | `RegisterPage` | No (redirects to `/movies` if already authed) |
| `/movies` | `MoviesPage` | Yes |
| `/movies/:id` | `MovieDetailPage` | Yes |
| `/watchlist` | `WatchlistPage` | Yes |
| `/profile` | `ProfilePage` | Yes |

Protected routes are wrapped in a `RequireAuth` component that redirects to `/login` if there is no valid token.

## Component structure

```
components/
├── Layout.tsx          # Shell with navigation bar; wraps all authenticated pages
├── MovieCard.tsx       # Card used in the movie grid (poster, title, genre, rating)
└── ui/
    ├── Alert.tsx
    ├── Badge.tsx
    ├── Button.tsx
    ├── Input.tsx
    ├── Select.tsx
    ├── Spinner.tsx
    ├── StarRating.tsx
    └── index.ts        # barrel export for ui/ only
```

Import UI components from `@/components/ui`:

```typescript
import { Button, Input, Spinner } from '@/components/ui';
```

## Styling

Tailwind CSS v4 via the Vite plugin (`@tailwindcss/vite`). No `tailwind.config.js` — configuration lives in `src/index.css`.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | Backend base URL |

Prefix all frontend env vars with `VITE_` for Vite to expose them to the browser.

## Scripts

```bash
npm run dev             # Vite dev server on :3001
npm run build           # production build
npm run preview         # serve the production build locally
npm run generate:api    # regenerate src/api/schema.d.ts from backend OpenAPI spec
npm run lint
```
