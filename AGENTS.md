# go-daily AGENTS.md

## Project Structure

- `frontend/` — React 19 + TypeScript 6 + Vite 8 + Tailwind 4 + Recharts
- `backend/` — Go 1.21 + Gin + GORM + SQLite
- Frontend is embedded into Go binary via `//go:embed` at compile time
  - vite `build.outDir` = `../backend/internal/embed/frontend/dist`
  - That dir must exist before `go build`/`go run`
- Two `config.yaml` files: root (used by production binary), `backend/` (dev)

## Development

- **Two terminals required**:
  - `cd frontend && npm run dev` (Vite HMR on `:5173`, proxies `/api` → `:8080`)
  - `cd backend && go run ./cmd/server/` (Gin on `:8080`)
- `npm run build` = `tsc -b && vite build` (type-check then build)
- `npm run lint` = `eslint .`
- **No backend linter or test files exist**

## Production Build

1. `cd frontend && npm run build` (outputs to `backend/internal/embed/frontend/dist/`)
2. `cd backend && go build -ldflags="-s -w" -o ../dist/app ./cmd/server/`
3. Or: `make build`

## Docker Build (Windows → Ubuntu)

- `deploy/build-ubuntu.ps1` runs `npm run build` then `docker buildx build`
- `Dockerfile.build` only builds Go binary — **frontend must be pre-built**

## Backend Architecture

```
main.go → config → database (AutoMigrate) → repositories → services → handlers → router
```

- All API responses: `{"code": 200, "data": ...}` or `{"code": 400, "message": "..."}`  
- Paginated: `{"code": 200, "data": [...], "total": N, "page": 1, "page_size": 20}`
- Auth: cookie-based `auth_token` (HMAC-SHA256, 24h expiry). Validated on all `/api/*` except `/login`, `/health`, `/logout`
- Record uniqueness: composite index `(date, period)` — one record per date+period

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET/POST/PUT/DELETE | `/api/records[/:id]` | Record CRUD |
| GET | `/api/records/today` | Today's records |
| PUT | `/api/records/today` | Upsert today |
| GET | `/api/records/export` | CSV/JSON export |
| GET | `/api/alerts` | Warning signals |
| GET/PUT | `/api/settings` | App config key-value |
| POST/DELETE | `/api/login`/`/api/logout` | Auth |
| GET | `/api/auth/status` | Check login status |
| GET | `/api/ai/summary` | Rule-based risk summary |
| GET | `/api/ai/context` | LLM-ready context |
| GET | `/api/ai/risk-score` | Numeric risk score |

## Key Conventions

- All UI text, comments, docs in **Chinese**
- No TypeScript path aliases — use relative imports
- Backend snake_case JSON, frontend camelCase TS (mapped in `api/client.ts`)
- String-typed numeric form fields (converted at save time)
- No test files, no database migrations (GORM AutoMigrate only)
- `backend/internal/ai/` is a **rule-based** risk engine, not an LLM call
- Record count limit: page_size max 200
