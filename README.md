# Data Pipeline Microservices

> **Candidate:** Aaron Hayden  
> **Stack:** TypeScript · Express · Prisma · PostgreSQL · Docker

A system of **3 interconnected microservices** implementing a simplified data ingestion and reporting pipeline.

---

## Architecture

```
                        ┌──────────────────┐
                        │   Dashboard      │
                        │   (Next.js)      │
                        │   :3000          │
                        └──────┬───────────┘
                               │ REST
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Ingestion   │────▶│  Transformation  │────▶│   Reporting     │
│  Service     │     │  Service         │     │   Service       │
│  :3001       │     │  :3002           │     │   :3003         │
└──────┬───────┘     └────────┬─────────┘     └────────┬────────┘
       │                      │                        │
       └──────────────────────┼────────────────────────┘
                              │
                     ┌────────▼────────┐
                     │   PostgreSQL    │
                     │   :5432        │
                     └─────────────────┘
```

### Data Flow

1. **Ingest** → `POST /api/ingest` accepts JSON sales records, validates with Zod, stores raw + normalised data
2. **Transform** → `POST /api/transform/:batchId` calculates revenue, deduplicates, aggregates daily totals
3. **Report** → `GET /api/reports/summary` & `/products` serve transformed data with caching, filtering, pagination

### Inter-Service Communication

- **REST** — Ingestion fires-and-forgets a POST to Transformation after successful ingest
- **Health checks** — Reporting pings Ingestion & Transformation via `/health` endpoints
- _Production upgrade: replace fire-and-forget with RabbitMQ/Redis pub-sub for reliable event-driven processing_

---

## Tech Stack

| Component        | Choice                  | Rationale                                             |
| ---------------- | ----------------------- | ----------------------------------------------------- |
| Runtime          | Node.js 20 LTS          | Stable, widely supported                              |
| Language         | TypeScript 5.7          | Type safety across services                           |
| Framework        | Express 4.21            | Widely understood, large ecosystem                    |
| ORM              | Prisma 5                | Declarative schema, auto-migrations, type-safe client |
| Validation       | Zod 3                   | Schema-first validation with TS inference             |
| Database         | PostgreSQL 16           | Robust relational DB                                  |
| Testing          | Vitest 2 + Supertest    | Fast TS-native test runner                            |
| Caching          | node-cache              | Zero-infra in-memory cache (60s TTL)                  |
| Containerisation | Docker + Docker Compose | One-command startup                                   |
| Dashboard        | Next.js 14 + Recharts   | App Router, server components, interactive charts     |
| Monorepo         | npm workspaces          | Shared code without extra tooling                     |

---

## Quick Start

### Prerequisites

- Docker & Docker Compose
- (Optional) Node.js 20+ for local development

### Run with Docker (recommended)

```bash
# Clone the repository
git clone <repo-url> && cd data-pipeline-microservices

# Start all services
docker-compose up --build
```

Services will be available at:

- **Dashboard: http://localhost:3000** (login: admin / password)
- Ingestion: http://localhost:3001
- Transformation: http://localhost:3002
- Reporting: http://localhost:3003

### Run Locally (development)

```bash
# Install dependencies
npm install

# Build shared package
npm run build --workspace=@mono/shared

# Start PostgreSQL (or use a remote instance)
docker run -d --name pg -e POSTGRES_DB=pipeline -e POSTGRES_USER=dev -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16-alpine

# Set environment
export DATABASE_URL=postgresql://dev:dev@localhost:5432/pipeline

# Run migrations (from each service)
cd services/ingestion && npx prisma migrate dev && cd ../..
cd services/transformation && npx prisma migrate dev && cd ../..

# Start services (in separate terminals)
npm run dev --workspace=@mono/ingestion
npm run dev --workspace=@mono/transformation
npm run dev --workspace=@mono/reporting
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests for a specific service
npm run test --workspace=@mono/ingestion
npm run test --workspace=@mono/transformation
npm run test --workspace=@mono/reporting
```

---

## API Reference

### Ingestion Service (`:3001`)

| Method | Endpoint                      | Description                        |
| ------ | ----------------------------- | ---------------------------------- |
| `POST` | `/api/ingest`                 | Ingest JSON array of sales records |
| `GET`  | `/api/ingest/status/:batchId` | Get batch processing status        |
| `GET`  | `/health`                     | Service health check               |

**POST /api/ingest** — Request body:

```json
[
  {
    "product_name": "Widget A",
    "quantity": 10,
    "unit_price": 25.99,
    "sale_date": "2026-01-15"
  }
]
```

**Response** (201):

```json
{
  "success": true,
  "data": {
    "batchId": "uuid",
    "status": "completed",
    "recordCount": 1,
    "errors": []
  }
}
```

### Transformation Service (`:3002`)

| Method | Endpoint                         | Description                        |
| ------ | -------------------------------- | ---------------------------------- |
| `POST` | `/api/transform/:batchId`        | Trigger transformation for a batch |
| `GET`  | `/api/transform/result/:batchId` | Get transformation results         |
| `GET`  | `/health`                        | Service health check               |

### Reporting Service (`:3003`)

| Method | Endpoint                                       | Description              |
| ------ | ---------------------------------------------- | ------------------------ |
| `POST` | `/api/auth/login`                              | Get JWT token (public)   |
| `GET`  | `/api/reports/summary?from=&to=&page=&limit=`  | Aggregated sales summary |
| `GET`  | `/api/reports/products?from=&to=&page=&limit=` | Per-product breakdown    |
| `GET`  | `/api/reports/health`                          | Health of all services   |
| `GET`  | `/health`                                      | Service health check     |

> **Note:** All `/api/reports/*` endpoints (except `/health`) require a JWT Bearer token.

---

## Authentication (Bonus)

The Reporting service includes JWT-based authentication. Obtain a token via the `/api/auth/login` endpoint, then pass it as a `Bearer` header.

**Demo Credentials:**

| Username | Password   | Role   |
| -------- | ---------- | ------ |
| `admin`  | `password` | admin  |
| `viewer` | `password` | viewer |

### Example: End-to-end cURL flow

```bash
# 1. Ingest sales data
curl -s -X POST http://localhost:3001/api/ingest \
  -H "Content-Type: application/json" \
  -d '[
    {"product_name": "Widget A", "quantity": 10, "unit_price": 25.99, "sale_date": "2026-01-15"},
    {"product_name": "Widget B", "quantity": 5,  "unit_price": 49.99, "sale_date": "2026-01-15"},
    {"product_name": "Widget A", "quantity": 3,  "unit_price": 25.99, "sale_date": "2026-01-16"}
  ]'
# → { "success": true, "data": { "batchId": "<uuid>", "status": "completed", ... } }

# 2. Check batch status
curl -s http://localhost:3001/api/ingest/status/<batchId>

# 3. Trigger transformation (auto-triggered by ingestion, but can be called manually)
curl -s -X POST http://localhost:3002/api/transform/<batchId>

# 4. Get transformation results
curl -s http://localhost:3002/api/transform/result/<batchId>

# 5. Obtain a JWT token
TOKEN=$(curl -s -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' \
  | jq -r '.data.token')

# 6. Query reports (with token)
curl -s http://localhost:3003/api/reports/summary \
  -H "Authorization: Bearer $TOKEN"

curl -s "http://localhost:3003/api/reports/products?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# 7. Health check (no token needed)
curl -s http://localhost:3003/api/reports/health
```

---

## Database Schema

### Ingestion-owned tables

- **batches** — Tracks batch ID, status (pending/processing/completed/failed), record count, timestamps
- **raw_records** — Stores verbatim JSON payload per record (audit trail)
- **normalised_records** — Validated & flattened records with proper types

### Transformation-owned tables

- **transformation_results** — Per-record results with calculated `total_revenue`
- **daily_aggregates** — Aggregated daily totals per product (unique on batch + product + date)

---

## Design Decisions & Trade-offs

| Decision                               | Reasoning                                                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Shared DB, logical table ownership** | Simplest for Docker Compose; production would use DB-per-service                                           |
| **Express over Fastify**               | Wider familiarity for assessors, lower risk in timed build                                                 |
| **Prisma over Knex**                   | Declarative schema = built-in migrations + type-safe client                                                |
| **node-cache over Redis**              | Zero infrastructure overhead; Redis recommended for production (cross-instance caching)                    |
| **REST over message queue**            | Spec endpoints are already REST-based; event-driven mentioned as production upgrade                        |
| **Fire-and-forget transform trigger**  | Ingestion calls Transformation asynchronously; production would use a proper message queue for reliability |
| **Monorepo with npm workspaces**       | Shared code (Zod schemas, types) without Turborepo/Nx complexity                                           |

---

## Edge Cases Handled

- **Negative quantities** — Accepted (refund scenario), flagged with warnings
- **Zero prices** — Accepted, total_revenue = 0
- **Duplicate records** — Deduplicated by (product_name, quantity, unit_price, sale_date)
- **Empty payloads** — Rejected with 400 error
- **Missing required fields** — Zod validation returns detailed field-level errors
- **Invalid dates** — Rejected at validation
- **Batch not found** — Returns 404

---

## Project Structure

```
├── package.json                    # Monorepo root (npm workspaces)
├── tsconfig.base.json              # Shared TypeScript config
├── eslint.config.mjs               # ESLint flat config
├── .prettierrc                     # Prettier config
├── docker-compose.yml              # Orchestration
├── .env.example                    # Environment template
│
├── packages/shared/                # @mono/shared — Zod schemas, types, constants
│
├── services/
│   ├── ingestion/                  # Port 3001
│   │   ├── prisma/schema.prisma
│   │   ├── Dockerfile
│   │   └── src/
│   │       ├── routes/ingest.ts
│   │       ├── services/ingestService.ts
│   │       ├── middleware/errorHandler.ts
│   │       └── __tests__/
│   │
│   ├── transformation/             # Port 3002
│   │   ├── prisma/schema.prisma
│   │   ├── Dockerfile
│   │   └── src/
│   │       ├── routes/transform.ts
│   │       ├── services/transformService.ts
│   │       └── __tests__/
│   │
│   ├── reporting/                  # Port 3003
│   │   ├── prisma/schema.prisma
│   │   ├── Dockerfile
│   │   └── src/
│   │       ├── routes/reports.ts
│   │       ├── services/reportService.ts
│   │       ├── services/cache.ts
│   │       ├── middleware/auth.ts
│   │       ├── routes/auth.ts
│   │       └── __tests__/
│   │
│   └── dashboard/                  # Port 3000 (Next.js)
│       ├── Dockerfile
│       ├── next.config.js
│       └── src/
│           ├── app/
│           │   ├── layout.tsx
│           │   ├── page.tsx          # → /login redirect
│           │   ├── login/page.tsx    # JWT login
│           │   └── dashboard/
│           │       ├── layout.tsx    # Sidebar nav
│           │       ├── page.tsx      # Overview + charts
│           │       ├── products/     # Product breakdown
│           │       ├── ingest/       # Data ingestion form
│           │       └── health/       # Service health
│           └── lib/
│               ├── api.ts            # API client
│               └── types.ts          # Response types
│
└── .github/workflows/ci.yml       # CI pipeline (lint → build → test)
```

---

## Bonus Features

| Feature                | Details                                                                        |
| ---------------------- | ------------------------------------------------------------------------------ |
| **Next.js Dashboard**  | Full-featured React UI: summary charts, product breakdown, data ingestion, health monitor |
| **JWT Authentication** | Bearer tokens on Reporting endpoints; `/api/auth/login` for token issuance     |
| **CI Pipeline**        | GitHub Actions: install → build → lint → test on every push/PR                 |
| **Graceful Shutdown**  | All services handle `SIGTERM`/`SIGINT` for clean Docker container stops        |
| **Health Dashboard**   | `/api/reports/health` pings all upstream services + DB with 3s timeout         |
| **Response Caching**   | node-cache with 60s TTL on Reporting queries; deterministic cache key building |

---

## What I'd Change in Production

| Area                    | Current (assessment scope)           | Production approach                                              |
| ----------------------- | ------------------------------------ | ---------------------------------------------------------------- |
| Inter-service messaging | REST fire-and-forget                 | RabbitMQ / Redis Streams for reliable event-driven processing    |
| Database per service    | Shared PostgreSQL, logical ownership | Separate databases with API boundaries                           |
| Auth                    | Hardcoded demo creds, symmetric JWT  | OAuth 2.0 / OIDC provider (Auth0, Cognito), asymmetric RS256     |
| Caching                 | In-memory node-cache                 | Redis for cross-instance caching with invalidation               |
| Observability           | Console logging                      | Structured JSON logging (pino), OpenTelemetry traces, Prometheus |
| Rate limiting           | None                                 | express-rate-limit + Redis store                                 |
| Secrets                 | .env / env vars                      | AWS Secrets Manager / Vault                                      |
