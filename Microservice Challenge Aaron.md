# Full-Stack Microservices — Technical Assessment

**Candidate:** Aaron Hayden  
**Date issued:** 2026-02-19  

---

## 1. Overview

This assessment evaluates your ability to design, build, and deploy a system of **3 interconnected microservices**.

The scenario is based on a simplified **data ingestion and reporting pipeline** — aligned with real-world data engineering and full-stack development work.

You are expected to demonstrate proficiency in:

- TypeScript/Node.js
- REST API design
- PostgreSQL
- Inter-service communication
- Containerisation

---

## 2. Time Allocation & Submission

- **Estimated time:** 4–6 hours (no strict deadline — quality over speed)
- Submit your solution as a **public or private Git repository link**
- Include a **README.md** with setup instructions, architecture decisions, and any trade-offs
- Email your Git link to: **recruitment@company.com**

---

## 3. System Architecture

Build the following **three microservices** that communicate via **REST** (and optionally a message queue):

### A. Ingestion Service

Accepts raw data payloads (JSON/CSV) via a REST endpoint, validates & normalises the data, then stores it in a PostgreSQL database.

**Endpoints**

- `POST /api/ingest` — accepts a JSON array of sales records
- `GET /api/ingest/status/:batchId` — returns processing status of a batch

**Requirements**

- Validate incoming records (required fields: `product_name`, `quantity`, `unit_price`, `sale_date`)
- Assign a unique **batch ID** to each ingestion request
- Store **raw + normalised** data in **separate tables**
- Return appropriate HTTP status codes and error messages for invalid data

### B. Transformation Service

Listens for new batches (via polling or event), applies business-logic transformations, and writes aggregated results.

**Endpoints**

- `POST /api/transform/:batchId` — triggers transformation for a batch
- `GET /api/transform/result/:batchId` — returns transformed/aggregated data

**Requirements**

- Calculate `total_revenue` (`quantity × unit_price`) per record
- Aggregate daily totals per product
- Handle edge cases:
  - Negative quantities
  - Zero prices
  - Duplicate records
- Store transformation results in a dedicated table

### C. Reporting Service

Exposes transformed data through query-able API endpoints for front-end consumption.

**Endpoints**

- `GET /api/reports/summary?from=&to=` — returns aggregated sales summary
- `GET /api/reports/products` — returns per-product breakdown
- `GET /api/reports/health` — returns health status of all services

**Requirements**

- Support date-range filtering and pagination
- Include a `/health` endpoint that pings Services A & B and reports their status
- Return well-structured JSON responses following a consistent schema
- Implement basic caching (in-memory or Redis) for repeated queries

---

## 4. Technical Requirements

### Language & Runtime

- TypeScript with Node.js (Express or Fastify)
- Alternatively: Python with FastAPI is acceptable

### Database

- PostgreSQL (local or Neon/Supabase free tier)
- Proper schema migrations (e.g. Knex, Prisma, or raw SQL files)

### Containerisation

- Dockerfile for each service
- `docker-compose.yml` to spin up all 3 services + database

### Testing

- Unit tests for core transformation logic
- At least one integration test for the full **ingest → transform → report** flow

### Code Quality

- ESLint / Prettier configured
- Clear folder structure with separation of concerns
- Environment variables via `.env` (no hardcoded secrets)

### Documentation

- README with architecture diagram (text-based is fine)
- API documentation (Swagger/OpenAPI preferred, or clear markdown)

---

## 5. Evaluation Criteria

| Criteria | Weight | What we look for |
|---|---:|---|
| Architecture & Design | 25% | Clean separation, sensible service boundaries, clear data flow |
| Code Quality | 25% | Readable, typed, well-structured, consistent patterns |
| Correctness | 20% | Edge cases handled, validations in place, accurate transformations |
| Testing | 15% | Meaningful tests, good coverage of critical paths |
| DevOps & Documentation | 15% | Working Docker setup, clear README, runnable with minimal setup |

---

## 6. Bonus (Optional)

- Add a simple React/Next.js dashboard that displays the reporting data with charts
- Implement event-driven communication between services (e.g. RabbitMQ, Redis Pub/Sub)
- Add authentication (JWT) to the Reporting Service
- Deploy to a free-tier cloud provider and provide a live URL
- CI/CD pipeline (GitHub Actions) for automated testing on push

---

## 7. Submission Instructions

1. Push your completed solution to a Git repository (GitHub, GitLab, or Bitbucket).
2. Ensure the repository includes a comprehensive `README.md`.
3. Verify that `docker-compose up` runs all services successfully.
4. Email your Git repository link to **recruitment@company.com** with the subject line:  
   **Technical Assessment – Aaron Hayden**

> This assessment is confidential. Please do not share or distribute.

Good luck, Aaron! We look forward to reviewing your work.

---

### Reference link (as included in the PDF)

- https://lovable.dev/projects/6d7522e9-97da-4fbb-b2af-97b5b0acd69f
