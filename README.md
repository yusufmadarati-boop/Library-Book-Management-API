# Library Book Management API (Prisma ORM + PostgreSQL)

An upgraded, production-ready RESTful API built with **Express 5**, **TypeScript**, **Prisma ORM 7**, **PostgreSQL**, and **Zod**, adhering strictly to clean layered architecture (**Routes -> Controllers -> Services -> Prisma/PostgreSQL**).

---

## Project Requirements Checklist (Session 6 — Assignment)

1. **Define the Prisma schema and run migrations** — Defined `Book` model in [`prisma/schema.prisma`](./prisma/schema.prisma) with UUID primary keys, timestamps, and indexes; applied initial migration via `prisma migrate dev`.
2. **Replace in-memory storage with PostgreSQL** — Removed the in-memory `Book[]` array and connected to **PostgreSQL** via `@prisma/client` and `@prisma/adapter-pg` in [`src/lib/prisma.ts`](./src/lib/prisma.ts).
3. **Implement all CRUD operations using Prisma** — Implemented `findMany` (with case-insensitive `genre`, `available`, and `search` filters), `findUnique`, `create`, `update`, and `delete` in [`src/services/book.service.ts`](./src/services/book.service.ts).
4. **Preserve the existing API contract and validation** — Preserved all endpoints (`GET /api/books`, `GET /api/books/:id`, `POST /api/books`, `PATCH /api/books/:id`, `DELETE /api/books/:id`), HTTP status codes (`200`, `201`, `400`, `404`, `500`), JSON response structures, and **Zod** validation schemas.
5. **Test all endpoints and verify data persistence** — Automated 12-step integration and persistence test suite in [`src/test-api.ts`](./src/test-api.ts) verifying all CRUD routes, validation errors, 404 handling, direct PostgreSQL row verification, and persistence across full server restarts.
6. **Document AI usage and verification** — Documented below and in [`AI_USAGE_AND_VERIFICATION.md`](./AI_USAGE_AND_VERIFICATION.md).

---

## Tech Stack

- **Runtime**: Node.js (ESM)
- **Framework**: Express.js 5 (`^5.3.0`)
- **Language**: TypeScript (`ES2022` / `NodeNext`)
- **ORM & Database**: Prisma ORM 7 (`@prisma/client`, `@prisma/adapter-pg`) + PostgreSQL 19 (`pg`)
- **Validation**: Zod (`^3.23.8`)
- **Tooling**: `tsx`, `rimraf`, `cors`, `dotenv`

---

## Project Architecture & Folder Structure

```text
work home/
├── generated/
│   └── prisma/                        # Auto-generated Prisma Client (TypeScript)
├── prisma/
│   ├── migrations/                    # SQL migrations managed by Prisma Migrate
│   ├── schema.prisma                  # Prisma schema defining PostgreSQL Book model
│   └── seed.ts                        # Database seed script for initial books
├── src/
│   ├── controllers/
│   │   └── book.controller.ts         # Async HTTP request/response handlers
│   ├── lib/
│   │   └── prisma.ts                  # Singleton PrismaClient with @prisma/adapter-pg
│   ├── middlewares/
│   │   ├── error.middleware.ts        # Centralized 404, JSON, Prisma, & 500 error handlers
│   │   └── validate.middleware.ts     # Generic Zod validation middleware & AppError
│   ├── models/
│   │   └── book.model.ts              # TypeScript Book interface
│   ├── routes/
│   │   └── book.routes.ts             # Express Router mapping endpoints to controllers
│   ├── schemas/
│   │   └── book.schema.ts             # Zod validation schemas for POST, PATCH, and params
│   ├── services/
│   │   └── book.service.ts            # Business logic & Prisma PostgreSQL CRUD queries
│   ├── app.ts                         # Express application factory & middleware pipeline
│   ├── server.ts                      # Entry point & graceful Prisma shutdown
│   └── test-api.ts                    # Automated CRUD + server-restart persistence tests
├── .env.example                       # Sample environment variables
├── AI_USAGE_AND_VERIFICATION.md       # Detailed AI usage & persistence verification report
├── package.json                       # Scripts & project dependencies
├── postman_collection.json            # Importable Postman Collection
├── prisma.config.ts                   # Prisma 7 configuration (schema, migrations, seed)
├── tsconfig.json                      # TypeScript compiler configuration
└── README.md                          # Project documentation
```

---

## Getting Started

### 1. Prerequisites
- **Node.js** (v20+)
- **PostgreSQL** (running locally on port `5432`)

### 2. Installation & Configuration

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure `.env` (copy from `.env.example` and set your PostgreSQL credentials):
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/library_books_db?schema=public"
   PORT=3000
   NODE_ENV=development
   ```

3. Run Prisma migrations, generate Prisma Client, and seed initial books:
   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   npm run prisma:seed
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

---

## API Endpoints & Contract (Preserved)

| Method | Endpoint | Success Status | Error Status | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | `200 OK` | — | Health check & endpoint overview |
| `GET` | `/api/books` | `200 OK` | `500` | List all books (`?genre=`, `?available=`, `?search=`) |
| `GET` | `/api/books/:id` | `200 OK` | `404 Not Found` | Retrieve a single book by ID |
| `POST` | `/api/books` | `201 Created` | `400 Bad Request` | Create a new book (Zod validated) |
| `PATCH` | `/api/books/:id` | `200 OK` | `400` / `404` | Partially update a book by ID (Zod validated) |
| `DELETE` | `/api/books/:id` | `200 OK` | `404 Not Found` | Delete a book by ID |

---

## Running Tests & Persistence Verification

Run the automated 12-step test suite (which also stops the HTTP server, queries PostgreSQL directly, starts a fresh server instance, and confirms data persists across restarts):

```bash
npm test
```

You can also import [`postman_collection.json`](./postman_collection.json) directly into **Postman** to test every endpoint and error case interactively, or inspect live database records via:

```bash
npm run prisma:studio
```

---

## AI Usage & Verification Summary

- **Prisma Schema & Migration Setup**: AI assisted in designing the `Book` model in `prisma/schema.prisma` (with UUID `@default(uuid())`, timestamps, and indexes on `genre` and `available`) and configuring Prisma 7 (`prisma.config.ts` and `@prisma/adapter-pg`).
- **Service Layer Refactoring (In-Memory -> PostgreSQL)**: AI refactored synchronous array methods in `BookService` into asynchronous Prisma queries (`findMany` with PostgreSQL `insensitive` filters, `findUnique`, `create`, `update`, and `delete`) and updated `BookController` methods to `await` service operations without altering any external route paths, status codes, or JSON response envelopes.
- **Verification & Human Review**: Every endpoint, Zod validation constraint, 404 edge case, TypeScript build (`npm run build`), SQL migration file, direct PostgreSQL table state, and server-restart persistence scenario was executed and verified end-to-end. See [`AI_USAGE_AND_VERIFICATION.md`](./AI_USAGE_AND_VERIFICATION.md) for full verification logs and SQL evidence.
