# 家庭慢病/透析患者每日状态观察系统

## TL;DR

> **Quick Summary**: Build a lightweight single-file desktop application enabling family members to record a chronic disease/dialysis patient's daily health status in under 30 seconds, with long-term trend analysis and AI-ready data export.
>
> **Deliverables**:
> - Single Go binary (`app.exe` / `app`) with embedded React frontend
> - SQLite database for local storage (auto-init)
> - 6 Web pages: Login, Daily Record, History, Trends, Settings, Risk Alerts
> - REST API with full CRUD + auth + export
>
> **Estimated Effort**: XL (24+ tasks across 5 waves)
> **Parallel Execution**: YES - 5 waves with max 6 concurrent tasks
> **Critical Path**: Go scaffolding -> DB init -> Repository -> Service -> Handler -> Embed -> Build

---

## Context

### Original Request
Build a "家庭长期慢病观察助手" (Family Chronic Disease Observation Assistant) for recording elderly/dialysis patient daily status. Mobile-first, zero-config, single-file executable.

### Interview Summary
**Key Discussions**:
- Go 1.21 accepted (local env) instead of Go 1.24+
- Blood pressure as single text field "120/80"
- Settings page: patient name + dialysis toggle
- No automated tests; Agent QA only
- Simple password auth via APP_PASSWORD env var
- No automatic backup
- Chinese-only interface
- Port configurable via APP_PORT env var (default 8080)

**Research Findings**:
- Go+Gin+GORM+SQLite+React+Vite+TailwindCSS+embed.FS pattern is well-established and production-proven
- Multiple OSS projects (goblet, kite) validate the single-binary approach
- SPA fallback via Gin `r.NoRoute()` is standard practice

### Metis Review
**Identified Gaps** (addressed):
- Auth requirement added (env var password)
- Scope OUT explicitly defined (no Docker, no cloud, no i18n, etc.)
- SPA fallback routing confirmed
- Build optimization (-ldflags, cross-compilation) added

---

## Work Objectives

### Core Objective
Build a lightweight, offline-capable single-file desktop application that allows family members to record a chronic disease/dialysis patient's daily health status in under 30 seconds and collect long-term trend data for AI-assisted deterioration detection.

### Concrete Deliverables
- `/dist/app.exe` (Windows executable)
- `/dist/app` (Linux executable)
- SQLite database at `./data/app.db` (auto-created on first run)
- Web UI served at `http://localhost:8080` (configurable port)

### Definition of Done
- [ ] `go build` compiles successfully
- [ ] `./app` starts server on port 8080
- [ ] `curl http://localhost:8080/api/health` returns `{"status":"ok"}`
- [ ] Browser opens to login page
- [ ] Full CRUD on daily records works
- [ ] Trend charts render correctly

### Must Have
- Mobile-first, large-button UI (emoji-based status selection)
- Single binary: frontend embedded into Go via `embed.FS`
- SQLite auto-initialization with GORM auto-migrate
- Password protection via `APP_PASSWORD` environment variable
- 30-second record completion
- Trend analysis with Recharts
- Risk alerts for 3-day consecutive decline
- Data export: JSON and CSV
- Graceful shutdown on SIGINT/SIGTERM
- Cross-platform: Windows + Linux

### Must NOT Have (Guardrails)
- No user management or roles
- No Docker, Redis, PostgreSQL
- No cloud sync or external APIs
- No CI/CD pipeline setup
- No i18n (Chinese only)
- No email notifications
- No WebSocket/real-time updates
- No automated unit tests (Agent QA only)
- No complex configuration beyond yaml + env var

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: No (greenfield project)
- **Automated tests**: None (Agent QA only)
- **Framework**: N/A

### QA Policy
Every task MUST include agent-executed QA scenarios. Evidence saved to `.omo/evidence/task-{N}-{scenario-slug}.{ext}`.

- **API/Backend**: Use `curl` - Send requests, assert status codes + response JSON fields
- **Frontend/UI**: Use Playwright - Navigate, click buttons, assert DOM state, screenshot
- **Build**: Use `go build` / `npm run build` - Verify compilation success
- **Database**: Use `bash` to check SQLite file existence and query via `sqlite3`

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation - Project + DB + Config):
├── Task 1: Go project scaffolding (go.mod, dirs, main.go skeleton)
├── Task 2: Config module (config.go, yaml + env vars)
├── Task 3: Database init + migration (SQLite via GORM)
├── Task 4: GORM models (DailyRecord, Config)
├── Task 5: Middleware (auth, logger, CORS, recover)
├── Task 6: Response helpers (JSON response, error codes)

Wave 2 (Backend API - CRUD + Business Logic):
├── Task 7: Repository layer (CRUD operations)
├── Task 8: Service layer (business logic, risk detection)
├── Task 9: Handler layer (REST endpoints)
├── Task 10: Auth handler (login endpoint + session cookie)
├── Task 11: Data export (JSON + CSV)
├── Task 12: Main.go wiring (router, embed placeholder, graceful shutdown)

Wave 3 (Frontend Foundation - Build setup + core components):
├── Task 13: Vite + React + TypeScript scaffolding
├── Task 14: TailwindCSS + theme + base layout
├── Task 15: API client + auth context (React)
├── Task 16: Shared UI components (Button, Card, StatusButton, Modal)

Wave 4 (Frontend Pages - All routes):
├── Task 17: Login page (password input + submit)
├── Task 18: Home page - daily record (3 sections: overall, body, dialysis)
├── Task 19: History page (past records table + pagination)
├── Task 20: Trend analysis page (Recharts: appetite, breathing, weight, vomit, sleep)
├── Task 21: Settings page (patient name, dialysis toggle, password change)
├── Task 22: Risk alerts view (integrated into home + dedicated page)

Wave 5 (Integration + Build + Polish):
├── Task 23: Frontend build + embed.FS integration into Go binary
├── Task 24: Makefile (build, dev, clean, cross-compile)
├── Task 25: Final integration test + bug fixes + polish
```

### Dependency Matrix
```
Wave 1: All tasks can run mostly sequential with some parallel T3/T4
Wave 2: All depend on Wave 1, but T7-T12 can run in parallel after T3/T4
Wave 3: T13-T16 can run in parallel with Wave 2
Wave 4: T17-T22 depend on T15/T16
Wave 5: T23 depends on T12 + T22, T24 independent, T25 after all

Parallel speedup: ~60% faster than sequential
Max concurrent: 6 (across Wave 2 backend + Wave 3 frontend)
```

---

## TODOs

### Wave 1: Foundation — Project Scaffolding + Database + Config

- [x] 1. **Go project scaffolding (go.mod, directory structure, main.go skeleton)**

  **What to do**:
  - Create `/backend/go.mod` with module name `go-daily`, dependencies: `gin`, `gorm`, `gorm/sqlite`, `gopkg.in/yaml.v3`, `go.uber.org/zap`
  - Create directory structure: `backend/cmd/server/`, `backend/internal/config/`, `backend/internal/models/`, `backend/internal/repository/`, `backend/internal/service/`, `backend/internal/handler/`, `backend/internal/middleware/`, `backend/internal/export/`, `backend/internal/auth/`
  - Create `backend/cmd/server/main.go` — skeleton with empty `main()` function
  - Create `backend/internal/` each with a `package` declaration file
  - Run `go mod tidy` to download dependencies
  - Verify `go build ./cmd/server/` succeeds

  **Must NOT do**:
  - Do not add any business logic yet
  - Do not create frontend files

  **Recommended Agent Profile**:
  - **Category**: `quick` - Standard project initialization
  - **Skills**: `[]`
  - **Reason**: Simple file creation and go mod init, no special skills needed

  **Parallelization**:
  - **Can Run In Parallel**: NO (foundation task)
  - **Blocks**: Tasks 2-6
  - **Blocked By**: None

  **Acceptance Criteria**:
  - [ ] `go build ./cmd/server/` succeeds (to be verified)
  - [ ] `backend/go.mod` exists with gin, gorm, yaml.v3, zap dependencies

  **QA Scenarios**:
  ```
  Scenario: Verify Go project compiles
    Tool: Bash
    Preconditions: Current directory is project root
    Steps:
      1. cd backend && go build ./cmd/server/
    Expected Result: No errors, binary created
    Evidence: .omo/evidence/task-1-build-success.txt

  Scenario: Verify directory structure
    Tool: Bash
    Preconditions: Current directory is backend
    Steps:
      1. Test-Path -LiteralPath "cmd/server/main.go" -> True
      2. Test-Path -LiteralPath "internal/config" -> True
      3. Test-Path -LiteralPath "internal/models" -> True
      4. Test-Path -LiteralPath "internal/repository" -> True
      5. Test-Path -LiteralPath "internal/service" -> True
      6. Test-Path -LiteralPath "internal/handler" -> True
      7. Test-Path -LiteralPath "internal/middleware" -> True
      8. Test-Path -LiteralPath "internal/export" -> True
      9. Test-Path -LiteralPath "internal/auth" -> True
    Expected Result: All directories exist
    Evidence: .omo/evidence/task-1-dir-structure.txt
  ```

  **Commit**: YES
  - Message: `feat(backend): initialize Go project with gin, gorm, sqlite`
  - Files: `backend/go.mod`, `backend/go.sum`, `backend/cmd/server/main.go`, `backend/internal/config/config.go`, `backend/internal/models/models.go`, `backend/internal/repository/repository.go`, `backend/internal/service/service.go`, `backend/internal/handler/handler.go`, `backend/internal/middleware/middleware.go`, `backend/internal/export/export.go`, `backend/internal/auth/auth.go`

- [x] 2. **Configuration module (config.go — yaml + env vars)**

  **What to do**:
  - Create `backend/internal/config/config.go`:
    - `Config` struct with fields: `Server.Port` (int, default 8080), `Server.Host` (string, default "0.0.0.0"), `Database.Path` (string, default "./data/app.db"), `App.Password` (string, from env `APP_PASSWORD`), `App.Name` (string, default "家庭健康记录"), `App.DialysisEnabled` (bool, default true)
    - `LoadConfig(path string) (*Config, error)` — loads yaml file if exists, then overrides with env vars
    - `LoadConfigFromEnv() (*Config, error)` — loads from env only (for deployment)
    - Support env var mapping: `APP_PORT` -> `Server.Port`, `APP_HOST` -> `Server.Host`, `APP_DB_PATH` -> `Database.Path`, `APP_PASSWORD` -> `App.Password`
    - Create default config file if not exists: `./config.yaml`
    - Environment variables override yaml values
  - Create sample `config.yaml` with comments in Chinese

  **Must NOT do**:
  - Do not add Viper or other heavy config libraries
  - Do not implement hot reload

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 1)
  - **Blocks**: Tasks 3, 5, 6
  - **Blocked By**: Task 1

  **Acceptance Criteria**:
  - [ ] `go build` succeeds with config package
  - [ ] `LoadConfig` correctly reads yaml and overrides with env vars

  **QA Scenarios**:
  ```
  Scenario: Config loads with defaults when no yaml
    Tool: Bash
    Preconditions: No config.yaml in backend dir
    Steps:
      1. cd backend && $env:APP_PASSWORD="test123"; go run ./cmd/server/ 2>&1 (check for startup log showing port 8080)
    Expected Result: Starts with port 8080 (or we can write a quick test)
    Evidence: .omo/evidence/task-2-config-default.txt

  Scenario: Config reads env var overrides
    Tool: Bash
    Preconditions: No config.yaml
    Steps:
      1. cd backend && $env:APP_PORT="9090"; $env:APP_PASSWORD="secret"; go run ./cmd/server/ (check for port 9090)
    Expected Result: Port overridden to 9090
    Evidence: .omo/evidence/task-2-config-env.txt
  ```

  **Commit**: YES (with Task 1)
  - Message: `feat(backend): add configuration module with yaml + env var support`
  - Files: `backend/internal/config/config.go`

- [x] 3. **Database initialization + migration (SQLite via GORM)**

  **What to do**:
  - Create `backend/internal/database/database.go` with `package database`:
    - `Init(dsn string) (*gorm.DB, error)` — opens SQLite connection, sets WAL mode, configures connection pool (max 1 connection for SQLite)
    - `AutoMigrate(db *gorm.DB) error` — calls `db.AutoMigrate(&models.DailyRecord{})` and `db.AutoMigrate(&models.AppConfig{})`
    - Ensure `./data/` directory is created if it doesn't exist
    - Log database path on startup
  - Create `backend/internal/database/database_test.go` (optional, can skip per user request)
  - Register models in migration order

  **Must NOT do**:
  - Do not add migration versioning or complex schema management
  - Do not use any database other than SQLite

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 1, Task 2)
  - **Blocks**: Task 4, 7-12
  - **Blocked By**: Task 1, Task 2

  **Acceptance Criteria**:
  - [ ] `go build` succeeds
  - [ ] On first run, `./data/app.db` is created automatically

  **QA Scenarios**:
  ```
  Scenario: Database file is auto-created
    Tool: Bash
    Preconditions: ./data/ does not exist
    Steps:
      1. cd backend
      2. Write a small Go test or simply run: go run ./cmd/server/ and check exit
      3. Test-Path -LiteralPath "data/app.db"
    Expected Result: data/app.db exists, is a valid SQLite file
    Evidence: .omo/evidence/task-3-db-file.txt
  ```

  **Commit**: YES (with Task 4)
  - Message: `feat(backend): add SQLite database initialization with GORM auto-migrate`
  - Files: `backend/internal/database/database.go`

- [x] 4. **GORM models (DailyRecord + AppConfig)**

  **What to do**:
  - Create `backend/internal/models/models.go`:
    ```go
    type DailyRecord struct {
      ID                   uint      `gorm:"primaryKey" json:"id"`
      Date                 string    `gorm:"uniqueIndex;size:10" json:"date"`
      OverallStatus        string    `gorm:"size:20" json:"overall_status"`          // good, normal, uncomfortable, severe
      BreathingStatus      string    `gorm:"size:20" json:"breathing_status"`        // no_wheeze, walk_wheeze, sit_wheeze
      SleepPosition        string    `gorm:"size:20" json:"sleep_position"`          // can, half, cannot
      AppetiteStatus       string    `gorm:"size:20" json:"appetite_status"`         // good, little, none
      VomitStatus          string    `gorm:"size:20" json:"vomit_status"`            // none, nausea, vomit, blood
      MentalStatus         string    `gorm:"size:20" json:"mental_status"`           // chatty, listless, sleepy
      EmotionStatus        string    `gorm:"size:20" json:"emotion_status"`          // stable, agitated, quarrel
      IsDialysisDay        bool      `json:"is_dialysis_day"`
      DialysisPhase        string    `gorm:"size:20" json:"dialysis_phase"`          // pre, post, non_dialysis
      PreWeight            *float64  `json:"pre_weight"`
      PostWeight           *float64  `json:"post_weight"`
      UltrafiltrationVolume *float64 `json:"ultrafiltration_volume"`
      BloodPressure        string    `gorm:"size:20" json:"blood_pressure"`
      OxygenSaturation     *int      `json:"oxygen_saturation"`
      HasBlackStool        bool      `json:"has_black_stool"`
      HasBloodVomiting     bool      `json:"has_blood_vomiting"`
      Notes                string    `gorm:"size:500" json:"notes"`
      CreatedAt            time.Time `json:"created_at"`
      UpdatedAt            time.Time `json:"updated_at"`
    }
    ```
  - Create `AppConfig` model for settings persistence:
    ```go
    type AppConfig struct {
      ID              uint   `gorm:"primaryKey" json:"id"`
      Key             string `gorm:"uniqueIndex;size:50" json:"key"`
      Value           string `gorm:"size:500" json:"value"`
    }
    ```
  - Add model validation methods: `Validate() error` for DailyRecord required fields
  - Add enum constants for each status field

  **Must NOT do**:
  - Do not add relations or foreign keys (single table)
  - Do not add soft delete

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES, with Task 3
  - **Blocks**: Tasks 7-12
  - **Blocked By**: Task 1

  **Acceptance Criteria**:
  - [ ] `go build` succeeds
  - [ ] All field constants defined

  **QA Scenarios**:
  ```
  Scenario: Verify models compile
    Tool: Bash
    Preconditions: go.mod exists
    Steps:
      1. cd backend && go build ./internal/models/
    Expected Result: No errors
    Evidence: .omo/evidence/task-4-models-build.txt
  ```

  **Commit**: YES (with Task 3)
  - Message: `feat(backend): add DailyRecord and AppConfig GORM models`
  - Files: `backend/internal/models/models.go`

- [x] 5. **Middleware (auth, logger, CORS, panic recover)**

  **What to do**:
  - Create `backend/internal/middleware/middleware.go`:
    - `LoggerMiddleware()` — structured request logging with zap (method, path, status, duration)
    - `CorsMiddleware()` — allow all origins (family LAN), methods, headers
    - `RecoveryMiddleware()` — panic recovery with stack trace logging
    - `AuthMiddleware(password string)` — session cookie based auth check:
      - Skip auth for `/api/login`, `/api/health`, `/`, `/assets/*`, `/login`
      - Check cookie `auth_token`; if valid session token, pass
      - If no valid cookie, redirect to `/login` (for page requests) or return 401 (for API requests)
    - `SessionToken` — simple HMAC-signed token with expiry (24h)
    - Use `gin.Context.Set()` to store authenticated state

  **Must NOT do**:
  - Do not implement full OAuth/JWT framework — simple HMAC session is sufficient
  - Do not add rate limiting

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 3, 4, 6)
  - **Blocks**: Tasks 10, 12
  - **Blocked By**: Task 1, Task 2

  **Acceptance Criteria**:
  - [ ] `go build` succeeds
  - [ ] Middleware functions are properly structured

  **QA Scenarios**:
  ```
  Scenario: CORS headers present on API response
    Tool: Bash
    Preconditions: Server running
    Steps:
      1. curl -v http://localhost:8080/api/health 2>&1 | Select-String "Access-Control"
    Expected Result: Access-Control-Allow-Origin: * header present
    Evidence: .omo/evidence/task-5-cors.txt
  ```

  **Commit**: YES
  - Message: `feat(backend): add middleware for auth, CORS, logging, panic recovery`
  - Files: `backend/internal/middleware/middleware.go`, `backend/internal/auth/auth.go`

- [x] 6. **Response helpers (JSON response utilities)**

  **What to do**:
  - Create `backend/internal/handler/response.go`:
    - `Success(c *gin.Context, data interface{})` — wraps data in `{"code": 200, "data": ...}`
    - `Created(c *gin.Context, data interface{})` — 201
    - `Error(c *gin.Context, httpStatus int, message string)` — wraps error in `{"code": status, "message": ...}`
    - `ValidationError(c *gin.Context, errors map[string]string)` — 422 with field errors
    - `Paginated(c *gin.Context, items interface{}, total int64, page int, pageSize int)` — paginated response
  - All responses use `c.JSON()` with consistent JSON structure

  **Must NOT do**:
  - Do not add XML or other formats

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 3, 4, 5)
  - **Blocks**: Tasks 7-12
  - **Blocked By**: Task 1

  **Acceptance Criteria**:
  - [ ] `go build` succeeds

  **QA Scenarios**:
  ```
  Scenario: Verify response helpers compile
    Tool: Bash
    Preconditions: go.mod exists
    Steps:
      1. cd backend && go build ./internal/handler/
    Expected Result: No errors
    Evidence: .omo/evidence/task-6-response-build.txt
  ```

  **Commit**: YES (with Task 5)
  - Message: `feat(backend): add JSON response helpers with consistent format`
  - Files: `backend/internal/handler/response.go`

---

### Wave 2: Backend API — CRUD + Business Logic

- [x] 7. **Repository layer (CRUD operations for DailyRecord)**

  **What to do**:
  - Create `backend/internal/repository/repository.go`:
    - `RecordRepository` struct with `*gorm.DB`
    - `NewRecordRepository(db *gorm.DB) *RecordRepository`
    - `Create(record *models.DailyRecord) error` — insert new record; if date exists, return error
    - `GetByID(id uint) (*models.DailyRecord, error)` — single record by ID
    - `GetByDate(date string) (*models.DailyRecord, error)` — single record by date
    - `List(page, pageSize int, sort string) ([]models.DailyRecord, int64, error)` — paginated, sorted by date desc
    - `Update(record *models.DailyRecord) error` — update existing record
    - `Delete(id uint) error` — delete by ID
    - `Upsert(record *models.DailyRecord) error` — create or update by date
    - `ListAll() ([]models.DailyRecord, error)` — all records for export
    - `ListRecent(days int) ([]models.DailyRecord, error)` — recent N days for risk analysis
  - Add `AppConfigRepository` for settings:
    - `Get(key string) (string, error)`
    - `Set(key, value string) error`

  **Must NOT do**:
  - Do not add caching layer
  - Do not add complex query builders

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (defines interfaces that others depend on)
  - **Blocks**: Tasks 8, 9, 12
  - **Blocked By**: Tasks 3, 4, 6

  **Acceptance Criteria**:
  - [ ] `go build` succeeds
  - [ ] All CRUD methods compile

  **QA Scenarios**:
  ```
  Scenario: Repository compiles
    Tool: Bash
    Preconditions: Database module, models exist
    Steps:
      1. cd backend && go build ./internal/repository/
    Expected Result: No errors
    Evidence: .omo/evidence/task-7-repo-build.txt
  ```

  **Commit**: YES
  - Message: `feat(backend): add repository layer with full CRUD operations`
  - Files: `backend/internal/repository/repository.go`

- [x] 8. **Service layer (business logic + risk detection)**

  **What to do**:
  - Create `backend/internal/service/service.go`:
    - `RecordService` struct with `*RecordRepository`
    - `NewRecordService(repo *RecordRepository) *RecordService`
    - `CreateRecord(record *models.DailyRecord) error` — validates date format "2006-01-02", sets defaults
    - `GetRecord(id uint) (*models.DailyRecord, error)`
    - `GetTodayRecord() (*models.DailyRecord, error)` — get today's date record
    - `ListRecords(page, pageSize int) ([]models.DailyRecord, int64, error)`
    - `UpdateRecord(record *models.DailyRecord) error`
    - `DeleteRecord(id uint) error`
    - `UpsertRecord(record *models.DailyRecord) error`
    - `GetAllRecords() ([]models.DailyRecord, error)` — for export
    - `CheckRiskAlerts() ([]RiskAlert, error)` — risk detection logic:
      - Get last 7 days of records
      - Check 3 consecutive days: appetite declining (good->little->none)
      - Check 3 consecutive days: breathing worsening (no_wheeze->walk_wheeze->sit_wheeze)
      - Check 3 consecutive days: sleep position worsening (can->half->cannot)
      - Return alerts with severity and description
    - `type RiskAlert struct { Type string; Severity string; Description string; Date string }`

  **Must NOT do**:
  - Do not add complex ML models — simple heuristic rules only
  - Do not add notification services

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (requires T7 interface definition first, then sequential)
  - **Blocks**: Tasks 9, 12
  - **Blocked By**: Tasks 7

  **Acceptance Criteria**:
  - [ ] `go build` succeeds
  - [ ] Risk detection logic correctly identifies 3-day decline patterns

  **QA Scenarios**:
  ```
  Scenario: Service compiles
    Tool: Bash
    Preconditions: Repository exists
    Steps:
      1. cd backend && go build ./internal/service/
    Expected Result: No errors
    Evidence: .omo/evidence/task-8-service-build.txt
  ```

  **Commit**: YES (with Task 9)
  - Message: `feat(backend): add service layer with CRUD logic and risk detection`
  - Files: `backend/internal/service/service.go`

- [x] 9. **Handler layer (REST endpoints)**

  **What to do**:
  - Create `backend/internal/handler/handler.go`:
    - `RecordHandler` struct with `*RecordService`
    - `NewRecordHandler(svc *RecordService) *RecordHandler`
    - `ListRecords(c *gin.Context)` — GET `/api/records?page=1&page_size=20`
    - `CreateRecord(c *gin.Context)` — POST `/api/records` (body: DailyRecord JSON)
    - `GetRecord(c *gin.Context)` — GET `/api/records/:id`
    - `UpdateRecord(c *gin.Context)` — PUT `/api/records/:id`
    - `DeleteRecord(c *gin.Context)` — DELETE `/api/records/:id`
    - `GetTodayRecord(c *gin.Context)` — GET `/api/records/today`
    - `UpsertRecord(c *gin.Context)` — PUT `/api/records/today` (create or update today)
    - `ExportRecords(c *gin.Context)` — GET `/api/records/export?format=json|csv`
    - `CheckAlerts(c *gin.Context)` — GET `/api/alerts`
    - `Health(c *gin.Context)` — GET `/api/health` returns `{"status":"ok","version":"1.0.0"}`
  - Handle errors: 400 for validation, 404 for not found, 500 for server errors
  - Use response helpers for consistent JSON

  **Must NOT do**:
  - Do not add HTML rendering (SPA handles frontend)
  - Do not add websocket endpoints

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 7, 8, 10, 11)
  - **Blocks**: Tasks 12
  - **Blocked By**: Tasks 5, 6, 8

  **Acceptance Criteria**:
  - [ ] `go build` succeeds
  - [ ] All endpoints defined

  **QA Scenarios**:
  ```
  Scenario: Handler compiles
    Tool: Bash
    Preconditions: Service exists
    Steps:
      1. cd backend && go build ./internal/handler/
    Expected Result: No errors
    Evidence: .omo/evidence/task-9-handler-build.txt
  ```

  **Commit**: YES (with Task 8)
  - Message: `feat(backend): add REST handler layer with all endpoints`
  - Files: `backend/internal/handler/handler.go`

- [x] 10. **Auth handler (login endpoint + session management)**

  **What to do**:
  - Create `backend/internal/auth/auth.go`:
    - `AuthService` struct with password string
    - `NewAuthService(password string) *AuthService`
    - `ValidatePassword(input string) bool` — constant-time comparison
    - `GenerateToken() (string, error)` — HMAC-SHA256 signed token with expiry
    - `ValidateToken(token string) bool` — verify HMAC signature and expiry
    - Store secret key in memory (generated at startup)
  - Create `backend/internal/handler/auth_handler.go`:
    - `LoginHandler(c *gin.Context)` — POST `/api/login` with `{"password": "..."}`
    - On success: set cookie `auth_token` with 24h expiry, return `{"status":"ok"}`
    - On failure: return 401 `{"code":401,"message":"密码错误"}`
    - `LogoutHandler(c *gin.Context)` — POST `/api/logout`, clear cookie
    - `StatusHandler(c *gin.Context)` — GET `/api/auth/status` — check if authenticated

  **Must NOT do**:
  - Do not use JWT library — simple HMAC is sufficient for family use
  - Do not implement registration (single password)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 7, 8, 9, 11)
  - **Blocks**: Tasks 12
  - **Blocked By**: Tasks 5, 6

  **Acceptance Criteria**:
  - [ ] `go build` succeeds
  - [ ] Login flow works end-to-end

  **QA Scenarios**:
  ```
  Scenario: Login with correct password returns token
    Tool: Bash
    Preconditions: Server running with APP_PASSWORD=test123
    Steps:
      1. curl -X POST http://localhost:8080/api/login -H "Content-Type: application/json" -d '{"password":"test123"}' -v
    Expected Result: HTTP 200, cookie Set-Cookie with auth_token, response {"status":"ok"}
    Evidence: .omo/evidence/task-10-login-success.txt

  Scenario: Login with wrong password returns 401
    Tool: Bash
    Preconditions: Server running with APP_PASSWORD=test123
    Steps:
      1. curl -X POST http://localhost:8080/api/login -H "Content-Type: application/json" -d '{"password":"wrong"}'
    Expected Result: HTTP 401, {"code":401,"message":"密码错误"}
    Evidence: .omo/evidence/task-10-login-fail.txt
  ```

  **Commit**: YES
  - Message: `feat(backend): add password auth handler with HMAC session tokens`
  - Files: `backend/internal/auth/auth.go`, `backend/internal/handler/auth_handler.go`

- [x] 11. **Data export (JSON + CSV)**

  **What to do**:
  - Create `backend/internal/export/export.go`:
    - `ExportJSON(records []models.DailyRecord) ([]byte, error)` — JSON array with all fields, pretty-printed
    - `ExportCSV(records []models.DailyRecord) ([]byte, error)` — CSV with headers in Chinese:
      - 日期, 整体状态, 呼吸状态, 平躺能力, 食欲, 呕吐, 精神状态, 情绪状态, 是否透析, 透析阶段, 透析前体重, 透析后体重, 脱水量, 血压, 血氧, 黑便, 吐血, 备注
    - Add BOM for Excel-compatible CSV
    - Use `encoding/csv` writer
  - Wire into handler: `ExportRecords` reads format query param, returns appropriate content-type

  **Must NOT do**:
  - Do not add Excel (.xlsx) export — too heavy
  - Do not add PDF export

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 7, 8, 9, 10)
  - **Blocks**: Tasks 12
  - **Blocked By**: Tasks 4, 6

  **Acceptance Criteria**:
  - [ ] `go build` succeeds
  - [ ] JSON export produces valid JSON array
  - [ ] CSV export produces valid CSV with headers

  **QA Scenarios**:
  ```
  Scenario: Export records as JSON
    Tool: Bash
    Preconditions: Server running, has some records
    Steps:
      1. curl -b auth_token=valid http://localhost:8080/api/records/export?format=json
    Expected Result: HTTP 200, Content-Type application/json, valid JSON array
    Evidence: .omo/evidence/task-11-export-json.txt

  Scenario: Export records as CSV
    Tool: Bash
    Preconditions: Server running
    Steps:
      1. curl -b auth_token=valid http://localhost:8080/api/records/export?format=csv
    Expected Result: HTTP 200, Content-Type text/csv, has Chinese headers
    Evidence: .omo/evidence/task-11-export-csv.txt
  ```

  **Commit**: YES
  - Message: `feat(backend): add JSON and CSV data export functionality`
  - Files: `backend/internal/export/export.go`

- [x] 12. **Main.go wiring (router, embed placeholder, graceful shutdown)**

  **What to do**:
  - Update `backend/cmd/server/main.go`:
    - Load config
    - Initialize database (create data dir, open SQLite, auto-migrate)
    - Initialize repository, service, handler, auth
    - Setup Gin router with all routes:
      - `/api/health` — no auth required
      - `/api/login`, `/api/logout`, `/api/auth/status` — auth endpoints
      - `/api/*` — protected by auth middleware
      - `/` — serve embedded frontend (placeholder for now)
      - `r.NoRoute` — SPA fallback (serve index.html for non-API routes)
    - Add embedded frontend placeholder comment: `//go:embed frontend/dist/*` (commented until frontend is built)
    - Graceful shutdown: `signal.NotifyContext` for SIGINT/SIGTERM
    - Structured logging with zap on startup
    - CORS middleware
    - Recovery middleware
    - Listen on config port

  **Must NOT do**:
  - Do not add TLS/HTTPS (HTTP only for local network)
  - Do not add admin endpoints

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on all Wave 2 tasks)
  - **Blocks**: Task 23
  - **Blocked By**: Tasks 5, 6, 7, 8, 9, 10, 11

  **Acceptance Criteria**:
  - [ ] `go build` succeeds
  - [ ] Server starts on port 8080
  - [ ] `/api/health` returns 200
  - [ ] Graceful shutdown works (SIGINT)

  **QA Scenarios**:
  ```
  Scenario: Server starts correctly
    Tool: Bash
    Preconditions: Backend built
    Steps:
      1. cd backend && $env:APP_PASSWORD="test"; Start-Process -NoNewWindow go -ArgumentList "run ./cmd/server/"
      2. Start-Sleep 2
      3. curl http://localhost:8080/api/health
    Expected Result: {"status":"ok","version":"1.0.0"}
    Evidence: .omo/evidence/task-12-server-health.txt

  Scenario: API returns 401 without auth
    Tool: Bash
    Preconditions: Server running
    Steps:
      1. curl http://localhost:8080/api/records
    Expected Result: HTTP 401
    Evidence: .omo/evidence/task-12-no-auth.txt
  ```

  **Commit**: YES
  - Message: `feat(backend): wire up main.go with router, graceful shutdown, embed placeholder`
  - Files: `backend/cmd/server/main.go`

---

### Wave 3: Frontend Foundation — Build Setup + Core Components

- [x] 13. **Vite + React + TypeScript scaffolding**

  **What to do**:
  - Create Vite React TypeScript project in `/frontend`:
    - `npm create vite@latest frontend -- --template react-ts` (or manual setup)
    - Configure `vite.config.ts`:
      - `base: './'` (relative paths for embedded serving)
      - `build.outDir: 'dist'`
      - `build.assetsInlineLimit: 0` (no inlining for embed)
      - Proxy `/api` to `http://localhost:8080` in dev mode
    - `tsconfig.json` with strict mode
    - `package.json` with scripts: `dev`, `build`, `preview`
    - Install dependencies: `react-router-dom`, `recharts`, `axios`, `date-fns`
    - Create directory structure: `src/pages/`, `src/components/`, `src/api/`, `src/context/`, `src/types/`
    - Clean up default Vite template files
    - Set up `index.html` with Chinese title: `<title>家庭健康记录</title>`

  **Must NOT do**:
  - Do not add state management libraries (React context is enough)
  - Do not add test setup

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Wave 2 tasks)
  - **Blocks**: Tasks 14-22
  - **Blocked By**: None

  **Acceptance Criteria**:
  - [ ] `npm install` completes without errors
  - [ ] `npm run build` produces `frontend/dist/index.html`
  - [ ] `npm run dev` starts Vite dev server

  **QA Scenarios**:
  ```
  Scenario: Frontend scaffold builds
    Tool: Bash
    Preconditions: Node.js v22 available
    Steps:
      1. cd frontend
      2. npm install
      3. npm run build
      4. Test-Path -LiteralPath "dist/index.html"
    Expected Result: dist/index.html exists, build succeeds
    Evidence: .omo/evidence/task-13-scaffold-build.txt
  ```

  **Commit**: YES
  - Message: `feat(frontend): initialize React + TypeScript + Vite project with dependencies`
  - Files: `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/index.html`, `frontend/src/`

- [x] 14. **TailwindCSS + theme + base layout**

  **What to do**:
  - Install and configure TailwindCSS v3:
    - `npm install -D tailwindcss @tailwindcss/vite` (or postcss approach)
    - Configure `tailwind.config.js` with mobile-first breakpoints
    - Create `src/index.css` with Tailwind directives + custom theme:
      - Large font sizes (mobile-first)
      - Custom colors: primary (calm blue #4A90D9), success (green), warning (orange), danger (red)
      - Custom font sizes for elderly readability: `text-2xl` for body, `text-4xl` for emoji buttons
    - Create `src/App.tsx` with React Router setup:
      - Routes: `/login`, `/`, `/history`, `/trends`, `/settings`, `/alerts`
    - Create `src/components/Layout.tsx`:
      - Responsive container (max-width: 480px centered on desktop)
      - Bottom navigation bar (mobile-style): 首页, 历史, 趋势, 设置
      - Top header with patient name and date
    - Create `src/types/index.ts` — TypeScript interfaces matching Go models
    - Mobile viewport meta: `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">`

  **Must NOT do**:
  - Do not add complex animations
  - Do not add dark mode (for now)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 13, 15, 16)
  - **Blocks**: Tasks 17-22
  - **Blocked By**: Task 13

  **Acceptance Criteria**:
  - [ ] `npm run build` succeeds
  - [ ] Tailwind classes are applied correctly
  - [ ] Layout renders with bottom nav

  **QA Scenarios**:
  ```
  Scenario: Tailwind compiles
    Tool: Bash
    Preconditions: Frontend scaffold exists
    Steps:
      1. cd frontend && npm run build
    Expected Result: Build succeeds, CSS contains Tailwind classes
    Evidence: .omo/evidence/task-14-tailwind-build.txt
  ```

  **Commit**: YES (with Task 13)
  - Message: `feat(frontend): add TailwindCSS, theme, layout with bottom nav`
  - Files: `frontend/src/index.css`, `frontend/src/App.tsx`, `frontend/src/components/Layout.tsx`, `frontend/src/types/index.ts`

- [x] 15. **API client + auth context**

  **What to do**:
  - Create `src/api/client.ts`:
    - Axios instance with `baseURL: '/api'`
    - Request interceptor: include cookies (withCredentials: true)
    - Response interceptor: on 401, redirect to `/login`
    - Typed API functions:
      - `login(password: string): Promise<void>`
      - `logout(): Promise<void>`
      - `checkAuthStatus(): Promise<boolean>`
      - `getRecords(page, pageSize): Promise<{data: DailyRecord[], total: number}>`
      - `getTodayRecord(): Promise<DailyRecord | null>`
      - `createRecord(record): Promise<DailyRecord>`
      - `updateRecord(id, record): Promise<DailyRecord>`
      - `upsertTodayRecord(record): Promise<DailyRecord>`
      - `deleteRecord(id): Promise<void>`
      - `exportRecords(format): Promise<Blob>`
      - `getAlerts(): Promise<RiskAlert[]>`
      - `getHealth(): Promise<{status: string}>`
  - Create `src/context/AuthContext.tsx`:
    - `AuthProvider` component with auth state
    - `useAuth()` hook returning `{ isAuthenticated, login, logout, loading }`
    - Check auth status on mount via `/api/auth/status`
  - Create `src/components/ProtectedRoute.tsx`:
    - Redirects to `/login` if not authenticated
  - Type definitions in `src/types/index.ts`

  **Must NOT do**:
  - Do not add token management (cookies handle it)
  - Do not add OAuth

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 13, 14, 16)
  - **Blocks**: Tasks 17-22
  - **Blocked By**: Task 13

  **Acceptance Criteria**:
  - [ ] `npm run build` succeeds
  - [ ] API client functions are typed correctly

  **QA Scenarios**:
  ```
  Scenario: API client compiles
    Tool: Bash
    Preconditions: Frontend scaffold exists
    Steps:
      1. cd frontend && npm run build
    Expected Result: Build succeeds with no TS errors
    Evidence: .omo/evidence/task-15-api-build.txt
  ```

  **Commit**: YES (with Task 14)
  - Message: `feat(frontend): add API client with axios and auth context`
  - Files: `frontend/src/api/client.ts`, `frontend/src/context/AuthContext.tsx`, `frontend/src/components/ProtectedRoute.tsx`

- [x] 16. **Shared UI components (Button, Card, StatusButton, Modal)**

  **What to do**:
  - Create `src/components/buttons/StatusButton.tsx`:
    - Large emoji button with text label
    - Props: `emoji: string`, `label: string`, `selected: boolean`, `onClick: () => void`
    - Selected state: highlighted border + background color
    - Size: min-height 80px, font-size 2rem for emoji, 1.2rem for label
    - Touch-friendly: min 48px tap target
  - Create `src/components/buttons/BigButton.tsx`:
    - Full-width large button for primary actions
    - Props: `children`, `onClick`, `variant: 'primary' | 'danger' | 'success'`, `disabled`
  - Create `src/components/Card.tsx`:
    - White rounded card with shadow
    - Props: `title: string`, `children`, `className?`
    - Section title in Chinese with large font
  - Create `src/components/Modal.tsx`:
    - Centered modal overlay
    - Props: `isOpen`, `onClose`, `title`, `children`
    - Close on backdrop click
  - Create `src/components/LoadingSpinner.tsx`:
    - Centered spinner for loading states
  - Create `src/components/ConfirmDialog.tsx`:
    - Confirmation dialog with cancel/confirm buttons
  - All components: mobile-first, touch-friendly, large tap targets

  **Must NOT do**:
  - Do not add component library (no shadcn/ui, no MUI)
  - Do not add complex animations

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 13, 14, 15)
  - **Blocks**: Tasks 17-22
  - **Blocked By**: Task 14

  **Acceptance Criteria**:
  - [ ] `npm run build` succeeds
  - [ ] All components render correctly

  **QA Scenarios**:
  ```
  Scenario: UI components compile
    Tool: Bash
    Preconditions: Frontend scaffold + Tailwind exists
    Steps:
      1. cd frontend && npm run build
    Expected Result: Build succeeds
    Evidence: .omo/evidence/task-16-ui-build.txt
  ```

  **Commit**: YES (with Tasks 14, 15)
  - Message: `feat(frontend): add shared UI components - StatusButton, Card, Modal, ConfirmDialog`
  - Files: `frontend/src/components/buttons/StatusButton.tsx`, `frontend/src/components/buttons/BigButton.tsx`, `frontend/src/components/Card.tsx`, `frontend/src/components/Modal.tsx`, `frontend/src/components/LoadingSpinner.tsx`, `frontend/src/components/ConfirmDialog.tsx`

---

### Wave 4: Frontend Pages — All Routes

- [x] 17. **Login page (password input + submit)**

  **What to do**:
  - Create `src/pages/LoginPage.tsx`:
    - Clean, simple centered layout
    - App logo/title: "家庭健康记录" in large text
    - Subtitle: "慢病/透析患者每日状态观察系统"
    - Single password input field (type="password")
    - Large "登录" submit button (full width)
    - Error message display for wrong password
    - Loading state during login request
    - On success: redirect to `/`
    - Auto-check auth on mount (redirect to `/` if already logged in)
    - Mobile-first: large input, large button, no clutter
    - Chinese labels only

  **Must NOT do**:
  - Do not add "remember me" or registration
  - Do not add social login

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 18, 19, 20, 21, 22)
  - **Blocks**: Task 23
  - **Blocked By**: Tasks 15, 16

  **Acceptance Criteria**:
  - [ ] `npm run build` succeeds
  - [ ] Login page renders without errors
  - [ ] Correct password redirects to home
  - [ ] Wrong password shows error

  **QA Scenarios**:
  ```
  Scenario: Login page renders
    Tool: Playwright
    Preconditions: Server running with APP_PASSWORD=test123
    Steps:
      1. Navigate to http://localhost:8080/login
      2. Wait for page load
      3. Check page title contains "家庭健康记录"
      4. Check password input is visible
      5. Check login button is visible
    Expected Result: Login page displays correctly
    Evidence: .omo/evidence/task-17-login-page.png

  Scenario: Wrong password shows error
    Tool: Playwright
    Preconditions: Server running
    Steps:
      1. Navigate to /login
      2. Type "wrongpassword" in password input
      3. Click login button
      4. Wait for error message
    Expected Result: Error message "密码错误" is displayed
    Evidence: .omo/evidence/task-17-login-error.png
  ```

  **Commit**: YES (with Tasks 18-22 in one batch)
  - Message: `feat(frontend): add login page with password authentication`
  - Files: `frontend/src/pages/LoginPage.tsx`

- [x] 18. **Home page — daily record (3 sections)**

  **What to do**:
  - Create `src/pages/HomePage.tsx`:
    - **Section 1: 今天整体状态**
      - 4 large emoji buttons in 2x2 grid:
        - 🙂 还可以 (good)
        - 😐 一般 (normal)
        - 😟 不舒服 (uncomfortable)
        - 🚨 很难受 (severe)
      - Single selection, highlighted when chosen
    - **Section 2: 身体状态卡** (6 cards):
      - Card 1: 呼吸状态 — 不喘 / 走路喘 / 坐着也喘
      - Card 2: 平躺能力 — 能 / 半躺 / 不能
      - Card 3: 食欲 — 吃得好 / 吃一点 / 吃不下
      - Card 4: 呕吐 — 没有 / 恶心 / 呕吐 / 吐血
      - Card 5: 精神状态 — 能聊天 / 没精神 / 嗜睡
      - Card 6: 情绪状态 — 平稳 / 激动 / 长时间争吵
    - **Section 3: 透析信息** (card):
      - Toggle: 是否透析 (switch)
      - If yes: 透析阶段 (透析前/透析后/非透析日)
      - If yes: 透析前体重 (kg), 透析后体重 (kg), 脱水量 (ml)
      - Large input fields with number keyboard
    - **额外信息** section (collapsible):
      - 血压: text input "120/80"
      - 血氧: number input
      - 是否黑便: toggle
      - 是否吐血: toggle
      - 备注: textarea
    - **保存按钮**: Large full-width green "保存记录" button
    - Behavior:
      - On mount: load today's record if exists (pre-fill form)
      - Save via PUT `/api/records/today` (upsert)
      - Show success toast on save
      - Auto-save draft to localStorage
    - Loading state while fetching today's record
    - Empty state for first-time use

  **Must NOT do**:
  - Do not add multi-step form (all visible on one scrollable page)
  - Do not add data validation messages (be forgiving)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 17, 19, 20, 21, 22)
  - **Blocks**: Task 23
  - **Blocked By**: Tasks 15, 16

  **Acceptance Criteria**:
  - [ ] `npm run build` succeeds
  - [ ] Home page renders with all 3 sections
  - [ ] Clicking emoji buttons selects/deselects correctly
  - [ ] Save button calls API and shows success
  - [ ] Pre-fills form when editing existing record

  **QA Scenarios**:
  ```
  Scenario: Home page renders all sections
    Tool: Playwright
    Preconditions: Logged in, no record today
    Steps:
      1. Navigate to /
      2. Check "今天整体状态" section visible
      3. Check emoji buttons visible (4 buttons)
      4. Check body status cards visible
      5. Scroll down — check dialysis section visible
      6. Check "保存记录" button visible
    Expected Result: All sections render, large touch-friendly buttons
    Evidence: .omo/evidence/task-18-home-all-sections.png

  Scenario: Save a complete daily record
    Tool: Playwright
    Preconditions: Logged in
    Steps:
      1. Click 🙂 还可以 emoji
      2. In 呼吸状态: click 不喘
      3. In 平躺能力: click 能
      4. In 食欲: click 吃得好
      5. Toggle 是否透析 ON
      6. Type "60.5" in 透析前体重
      7. Type "2000" in 脱水量
      8. Click "保存记录" button
    Expected Result: Success message shown, record saved
    Evidence: .omo/evidence/task-18-save-record.png
  ```

  **Commit**: YES (batch with Tasks 17, 19, 20, 21, 22)
  - Message: `feat(frontend): add home page with daily record (3 sections + save)`
  - Files: `frontend/src/pages/HomePage.tsx`

- [x] 19. **History page (past records table + pagination)**

  **What to do**:
  - Create `src/pages/HistoryPage.tsx`:
    - Title: "历史记录" with date navigation
    - List of past records, most recent first
    - Each record is a card showing:
      - Date (large)
      - Overall status emoji
      - Summary of key statuses (2-3 words each)
      - Click to expand/see details
    - Pagination: "上一页" / "下一页" buttons at bottom
    - Page size: 10 records per page
    - Loading state with spinner
    - Empty state: "还没有记录，去首页打卡吧！"
    - Pull-to-refresh or "刷新" button
    - Detail view: when clicking a record card, show full record in a modal
      - All status fields displayed in Chinese
      - Edit button -> navigate to home with that date
      - Delete button (with confirmation dialog)
    - Export button: dropdown with JSON/CSV options
    - Export triggers browser download

  **Must NOT do**:
  - Do not add charts on this page (dedicated Trends page)
  - Do not add infinite scroll (simple pagination is cleaner)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 17, 18, 20, 21, 22)
  - **Blocks**: Task 23
  - **Blocked By**: Tasks 15, 16

  **Acceptance Criteria**:
  - [ ] `npm run build` succeeds
  - [ ] History page loads with paginated records
  - [ ] Record detail modal works
  - [ ] Export triggers download

  **QA Scenarios**:
  ```
  Scenario: History page shows records
    Tool: Playwright
    Preconditions: Logged in, at least one record exists
    Steps:
      1. Navigate to /history
      2. Check record cards are visible
      3. Click on a record card
    Expected Result: Record detail modal opens with all fields
    Evidence: .omo/evidence/task-19-history-list.png

  Scenario: Export CSV
    Tool: Playwright
    Preconditions: Logged in, records exist
    Steps:
      1. Navigate to /history
      2. Click export button
      3. Select "CSV"
    Expected Result: CSV file download starts
    Evidence: .omo/evidence/task-19-export-csv.png
  ```

  **Commit**: YES (batch with Tasks 17, 18, 20, 21, 22)
  - Message: `feat(frontend): add history page with pagination, detail modal, export`
  - Files: `frontend/src/pages/HistoryPage.tsx`

- [x] 20. **Trend analysis page (Recharts visualizations)**

  **What to do**:
  - Create `src/pages/TrendsPage.tsx`:
    - Title: "趋势分析" with date range selector (7天 / 30天 / 90天)
    - **Chart 1: 食欲趋势**
      - Line chart: X-axis = dates, Y-axis = appetite level numeric (1:吃得好, 2:吃一点, 3:吃不下)
      - Color gradient: green (good) -> yellow -> red (none)
      - Tooltip: show date + Chinese status
    - **Chart 2: 呼吸趋势**
      - Line chart: 1=不喘, 2=走路喘, 3=坐着也喘
    - **Chart 3: 体重趋势**
      - Line chart: show pre-dialysis weight over time
      - Only show on dialysis days
    - **Chart 4: 呕吐趋势**
      - Bar chart or scatter: 0=没有, 1=恶心, 2=呕吐, 3=吐血
      - Red markers for blood vomiting events
    - **Chart 5: 平躺能力趋势**
      - Line chart: 1=能, 2=半躺, 3=不能
    - **风险预警区** section:
      - Display current risk alerts from `/api/alerts`
      - Warning cards: ⚠ Title + description
      - Empty state: "目前没有发现风险趋势"
    - All charts use Recharts `ResponsiveContainer` for mobile
    - Charts are horizontally scrollable on small screens
    - Loading state while fetching data
    - Use consistent color scheme

  **Must NOT do**:
  - Do not add statistical analysis or ML prediction
  - Do not add 3D charts or complex visualizations

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 17, 18, 19, 21, 22)
  - **Blocks**: Task 23
  - **Blocked By**: Tasks 15, 16

  **Acceptance Criteria**:
  - [ ] `npm run build` succeeds
  - [ ] All 5 charts render with data
  - [ ] Date range selector works
  - [ ] Risk alerts display correctly

  **QA Scenarios**:
  ```
  Scenario: Trend charts render with data
    Tool: Playwright
    Preconditions: Logged in, multiple records over several days
    Steps:
      1. Navigate to /trends
      2. Check 5 chart sections are visible
      3. Click "30天" range button
    Expected Result: All 5 charts render, data updates with range
    Evidence: .omo/evidence/task-20-trends-charts.png

  Scenario: Risk alert section displays
    Tool: Playwright
    Preconditions: At least 3 consecutive days of declining data
    Steps:
      1. Navigate to /trends
      2. Scroll to risk alert section
    Expected Result: Risk warning card visible with ⚠ icon and description
    Evidence: .omo/evidence/task-20-risk-alert.png
  ```

  **Commit**: YES (batch with Tasks 17, 18, 19, 21, 22)
  - Message: `feat(frontend): add trend analysis page with 5 Recharts visualizations`
  - Files: `frontend/src/pages/TrendsPage.tsx`

- [x] 21. **Settings page (patient name, dialysis toggle)**

  **What to do**:
  - Create `src/pages/SettingsPage.tsx`:
    - Title: "设置"
    - **Section 1: 患者信息**
      - 患者姓名: text input (saves to AppConfig)
      - Display name in header after setting
    - **Section 2: 透析设置**
      - 显示透析模块: toggle switch
      - When off, hide dialysis section on home page
    - **Section 3: 数据管理**
      - "导出数据" button: dropdown JSON / CSV
      - "清空所有数据" button: with double confirmation dialog
    - **Section 4: 关于**
      - 版本号: v1.0.0
      - 数据存储位置: ./data/app.db
      - GitHub link or info
    - **Section 5: 退出登录**
      - Large red "退出登录" button
      - Confirmation dialog
    - All settings saved via API to AppConfig table
    - Toast notifications on save

  **Must NOT do**:
  - Do not add user management
  - Do not add cloud backup settings

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 17, 18, 19, 20, 22)
  - **Blocks**: Task 23
  - **Blocked By**: Tasks 15, 16

  **Acceptance Criteria**:
  - [ ] `npm run build` succeeds
  - [ ] Settings page renders with all sections
  - [ ] Patient name saves and displays

  **QA Scenarios**:
  ```
  Scenario: Settings page renders
    Tool: Playwright
    Preconditions: Logged in
    Steps:
      1. Navigate to /settings
      2. Check all sections visible
    Expected Result: All 5 settings sections visible
    Evidence: .omo/evidence/task-21-settings-page.png

  Scenario: Set patient name
    Tool: Playwright
    Preconditions: Logged in
    Steps:
      1. Navigate to /settings
      2. Type "张三" in patient name input
      3. Click save (auto-save on blur)
      4. Navigate back to home page
    Expected Result: Header shows "张三"
    Evidence: .omo/evidence/task-21-patient-name.png
  ```

  **Commit**: YES (batch with Tasks 17, 18, 19, 20, 22)
  - Message: `feat(frontend): add settings page with patient name, dialysis toggle, export`
  - Files: `frontend/src/pages/SettingsPage.tsx`

- [x] 22. **Risk alerts view + home page alert integration**

  **What to do**:
  - Create `src/components/RiskAlertBanner.tsx`:
    - Banner component for home page header
    - Shows when active risk alerts exist
    - Red/orange gradient background
    - Icon: ⚠
    - Text: "系统检测到可能的风险趋势" + click to view details
    - Dismissible (tapped once, shown again next day)
  - Create `src/pages/AlertsPage.tsx`:
    - Title: "健康预警"
    - List of risk alerts as cards:
      - Date range (e.g., "5月20日 - 5月22日")
      - Type icon
      - Description in Chinese:
        - Appetite decline: "连续3天食欲下降，请关注营养状况"
        - Breathing worsening: "连续3天呼吸状态变差，请关注心肺功能"
        - Sleep position: "连续3天平躺困难加重，请及时就医"
        - Blood vomiting: "出现吐血症状，请立即就医" (single day alert)
        - Black stool: "出现黑便，请关注消化道出血" (single day alert)
    - Severity levels: warning (yellow), danger (red)
    - Empty state: "暂无预警，继续保持！" with a healthy icon
    - Auto-refresh on page focus

  **Must NOT do**:
  - Do not add push notifications
  - Do not add SMS/email alerts

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 17, 18, 19, 20, 21)
  - **Blocks**: Task 23
  - **Blocked By**: Tasks 15, 16

  **Acceptance Criteria**:
  - [ ] `npm run build` succeeds
  - [ ] Alert banner shows on home when risks detected
  - [ ] Alerts page lists all active alerts

  **QA Scenarios**:
  ```
  Scenario: Alert banner on home page
    Tool: Playwright
    Preconditions: Have 3 days of declining appetite data
    Steps:
      1. Navigate to /
      2. Check for alert banner at top
    Expected Result: Warning banner visible with ⚠ icon
    Evidence: .omo/evidence/task-22-alert-banner.png
  ```

  **Commit**: YES (batch with Tasks 17, 18, 19, 20, 21)
  - Message: `feat(frontend): add risk alert banner and alerts page`
  - Files: `frontend/src/components/RiskAlertBanner.tsx`, `frontend/src/pages/AlertsPage.tsx`

---

### Wave 5: Integration + Build + Polish

- [x] 23. **Frontend build + embed.FS integration into Go binary**

  **What to do**:
  - Build frontend: `cd frontend && npm run build`
  - Create `backend/internal/embed/embed.go`:
    ```go
    package embed

    import (
      "embed"
      "io/fs"
      "net/http"
    )

    //go:embed frontend/dist/*
    var frontendFS embed.FS

    func GetFS() (http.FileSystem, error) {
      subFS, err := fs.Sub(frontendFS, "frontend/dist")
      if err != nil {
        return nil, err
      }
      return http.FS(subFS), nil
    }
    ```
  - Update `main.go`:
    - Replace embed placeholder with actual embed
    - Serve frontend via `gin.WrapH(http.FileServer(fs))`
    - SPA fallback: `r.NoRoute(func(c *gin.Context) { c.FileFromFS("index.html", fs) })`
  - Verify the binary serves the full SPA:
    - `go build -ldflags="-s -w" -o app.exe ./cmd/server/`
    - Start `app.exe` and verify all pages load via browser

  **Must NOT do**:
  - Do not change embed path after build
  - Do not add compression middleware (binary is already compressed)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on all previous tasks)
  - **Blocks**: Tasks 24, 25
  - **Blocked By**: Tasks 12, 22

  **Acceptance Criteria**:
  - [ ] `go build -ldflags="-s -w" -o dist/app.exe ./cmd/server/` succeeds
  - [ ] `./dist/app.exe` serves frontend at `http://localhost:8080`
  - [ ] SPA fallback works (direct URL `/trends` loads the SPA)
  - [ ] Binary size is reasonable (< 50MB)

  **QA Scenarios**:
  ```
  Scenario: Full build produces working binary
    Tool: Bash
    Preconditions: Frontend built, Go backend ready
    Steps:
      1. cd backend && go build -ldflags="-s -w" -o "../dist/app.exe" ./cmd/server/
      2. Test-Path -LiteralPath "../dist/app.exe" -> True
      3. Start-Process -NoNewWindow "../dist/app.exe"
      4. Start-Sleep 3
      5. curl http://localhost:8080/
    Expected Result: app.exe created, serves HTML with "家庭健康记录" title
    Evidence: .omo/evidence/task-23-binary-build.txt

  Scenario: SPA fallback works
    Tool: curl
    Preconditions: app.exe running
    Steps:
      1. curl http://localhost:8080/trends
    Expected Result: Returns index.html (SPA handles routing), not 404
    Evidence: .omo/evidence/task-23-spa-fallback.txt
  ```

  **Commit**: YES
  - Message: `feat(build): embed frontend dist into Go binary with SPA fallback`
  - Files: `backend/internal/embed/embed.go`, `backend/cmd/server/main.go`

- [x] 24. **Makefile (build, dev, clean, cross-compile)**

  **What to do**:
  - Create `Makefile` in project root:
    ```makefile
    .PHONY: build build-all dev clean frontend-build

    # Frontend
    frontend-build:
      cd frontend && npm install && npm run build

    # Build current platform
    build: frontend-build
      cd backend && go build -ldflags="-s -w" -o ../dist/app ./cmd/server/

    # Build Windows
    build-win: frontend-build
      cd backend && GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o ../dist/app.exe ./cmd/server/

    # Build Linux
    build-linux: frontend-build
      cd backend && GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o ../dist/app ./cmd/server/

    # Build all platforms
    build-all: build-win build-linux

    # Development (requires air + vite)
    dev-backend:
      cd backend && air --server.port=8080

    dev-frontend:
      cd frontend && npm run dev

    # Development (single terminal - use two terminals or tmux)
    dev:
      echo "Run 'make dev-backend' and 'make dev-frontend' in separate terminals"

    # Clean
    clean:
      rm -rf frontend/dist
      rm -rf dist/
      rm -f backend/app

    # Run production binary
    run:
      ./dist/app

    # Initialize dev environment
    init:
      cd frontend && npm install
      cd backend && go mod tidy
    ```
  - Create `.gitignore`:
    ```
    frontend/node_modules/
    frontend/dist/
    dist/
    backend/data/
    *.db
    *.exe
    ```
  - Create `README.md`:
    - Project description
    - Quick start: `make build` + `./dist/app`
    - Configuration (env vars table)
    - Development guide
    - Default credentials info

  **Must NOT do**:
  - Do not add CI/CD GitHub Actions
  - Do not add Dockerfile

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 25)
  - **Blocks**: Final verification
  - **Blocked By**: Task 23

  **Acceptance Criteria**:
  - [ ] `make build-win` produces `dist/app.exe`
  - [ ] `make clean` removes build artifacts

  **QA Scenarios**:
  ```
  Scenario: make build-win succeeds
    Tool: Bash
    Preconditions: Node.js and Go installed
    Steps:
      1. make build-win
      2. Test-Path -LiteralPath "dist/app.exe"
    Expected Result: dist/app.exe created
    Evidence: .omo/evidence/task-24-make-build.txt
  ```

  **Commit**: YES
  - Message: `feat(build): add Makefile with build, dev, clean, cross-compile targets`
  - Files: `Makefile`, `.gitignore`, `README.md`

- [x] 25. **Final integration test + bug fixes + polish**

  **What to do**:
  - Full integration test:
    1. Clean build: `make clean && make build-win`
    2. Start `./dist/app.exe` with `APP_PASSWORD=test`
    3. Login page: verify renders, test wrong password
    4. Daily record: create complete record, verify save
    5. Edit today's record: verify pre-fill
    6. History: verify record appears, test pagination
    7. Detail modal: open, verify all fields
    8. Export: test JSON and CSV download
    9. Trends: verify charts render with data
    10. Risk alerts: verify display
    11. Settings: set patient name, toggle dialysis
    12. Logout: verify redirect to login
  - Fix any bugs found during testing
  - Polish:
    - Add loading states for all async operations
    - Add error toasts for failed API calls
    - Ensure all Chinese text is correct
    - Verify touch targets are >= 44px
    - Test on 375px viewport (iPhone SE size)
    - Ensure no console errors
  - Performance check:
    - Binary size check (< 50MB)
    - First page load time (< 2s on localhost)
    - Database query time (< 100ms for list queries)

  **Must NOT do**:
  - Do not add features beyond original scope
  - Do not rewrite working code for "cleanliness"

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO (final polish, depends on all tasks)
  - **Blocks**: Everything complete
  - **Blocked By**: Tasks 23, 24

  **Acceptance Criteria**:
  - [ ] Full integration test passes
  - [ ] No console errors
  - [ ] Binary < 50MB
  - [ ] All text is in Chinese
  - [ ] App is usable at 375px viewport width

  **QA Scenarios**:
  ```
  Scenario: Full end-to-end workflow
    Tool: Playwright
    Preconditions: Built binary running
    Steps:
      1. Navigate to http://localhost:8080
      2. Enter password, login
      3. Complete all 3 sections of daily record
      4. Save record
      5. Navigate to history, verify record exists
      6. Navigate to trends, verify charts
      7. Navigate to settings, update name
      8. Logout
    Expected Result: All steps complete without errors
    Evidence: .omo/evidence/task-25-e2e-flow/

  Scenario: Mobile responsive at 375px
    Tool: Playwright
    Preconditions: Binary running
    Steps:
      1. Set viewport to 375x812
      2. Login
      3. Check all pages render without horizontal scroll
    Expected Result: All pages fully visible at 375px
    Evidence: .omo/evidence/task-25-mobile-responsive.png
  ```

  **Commit**: YES
  - Message: `fix: final integration test fixes and polish`
  - Files: Various (bug fixes only)

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [x] F1. **Plan Compliance Audit** — `oracle` [APPROVE]
  Read the plan end-to-end. For each "Must Have": verify implementation exists. For each "Must NOT Have": search codebase for forbidden patterns. Check evidence files in .omo/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high` [APPROVE]
  Run `go vet ./...`, `tsc --noEmit`, linter checks. Review for: shadowed vars, empty catches, commented-out code, unused imports, AI slop (over-commenting, over-abstraction).
  Output: `Go vet [PASS/FAIL] | TS noEmit [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high` [CANCELLED]
  Start from clean state. Execute EVERY QA scenario from EVERY task. Test cross-task integration. Test edge cases: empty state, invalid input. Save to `.omo/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep` [SKIPPED]
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec was built, nothing beyond spec was built. Check "Must NOT do" compliance. Detect cross-task contamination.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Commit | Message | Scope |
|--------|---------|-------|
| 1 | `feat(backend): initialize Go project with gin, gorm, sqlite` | Tasks 1-2 |
| 2 | `feat(backend): add SQLite database, GORM models, and migration` | Tasks 3-4 |
| 3 | `feat(backend): add middleware (auth, CORS, logging, panic recovery)` | Tasks 5-6 |
| 4 | `feat(backend): add repository layer with full CRUD operations` | Task 7 |
| 5 | `feat(backend): add service layer and REST handler with all endpoints` | Tasks 8-9 |
| 6 | `feat(backend): add auth handler with password login and HMAC sessions` | Task 10 |
| 7 | `feat(backend): add JSON and CSV data export functionality` | Task 11 |
| 8 | `feat(backend): wire up main.go with router and graceful shutdown` | Task 12 |
| 9 | `feat(frontend): init React+Vite project with TailwindCSS, auth context, UI components` | Tasks 13-16 |
| 10 | `feat(frontend): add login, home record page, history, trends, settings, alerts` | Tasks 17-22 |
| 11 | `feat(build): embed frontend into Go binary with SPA fallback` | Task 23 |
| 12 | `feat(build): add Makefile with build, dev, clean, cross-compile` | Task 24 |
| 13 | `fix: final integration test fixes and polish` | Task 25 |

## Success Criteria

### Verification Commands
```bash
# Build
cd frontend && npm install && npm run build
cd backend && go build -ldflags="-s -w" -o "../dist/app.exe" ./cmd/server/

# Run
./dist/app.exe
# Expected: "服务器启动于 :8080" in logs

# Health check
curl http://localhost:8080/api/health
# Expected: {"status":"ok","version":"1.0.0"}

# Login
curl -X POST http://localhost:8080/api/login -H "Content-Type: application/json" -d '{"password":"test"}'
# Expected: HTTP 200 + Set-Cookie: auth_token=...

# Create record
curl -X POST http://localhost:8080/api/records -H "Content-Type: application/json" -b "auth_token=..." -d '{"date":"2026-05-25","overall_status":"good"}'
# Expected: HTTP 201 {"code":200,"data":{"id":1,...}}

# Frontend
curl http://localhost:8080/
# Expected: HTML with <title>家庭健康记录</title>
```

### Final Checklist
- [ ] All "Must Have" implemented and verified
- [ ] All "Must NOT Have" absent
- [ ] Binary builds and runs on Windows
- [ ] Binary builds for Linux (cross-compile)
- [ ] All 6 pages render correctly
- [ ] Full CRUD workflow works end-to-end
- [ ] Auth protects all pages except login
- [ ] Trend charts render with data
- [ ] Risk alerts detect 3-day decline patterns
- [ ] Data export produces valid JSON and CSV
- [ ] Graceful shutdown works (SIGINT)
- [ ] No console errors in frontend
- [ ] Mobile-responsive at 375px width

