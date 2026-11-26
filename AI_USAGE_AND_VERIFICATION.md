# AI Usage & Verification Documentation

**Project**: Library Book Management API — Session 6 Assignment (Prisma ORM & PostgreSQL Upgrade)

---

## 1. AI Usage Breakdown

In accordance with **Requirement 6** (*"Document AI usage and verification"*), AI assistance was utilized in the following structured phases during the upgrade of the Session 4 in-memory Library API to **Prisma ORM 7** and **PostgreSQL 19**:

### A. Prisma Schema & Migration Configuration
- **How AI Was Used**: Designed [`prisma/schema.prisma`](./prisma/schema.prisma) for the `Book` entity (`id`, `title`, `author`, `genre`, `available`, `createdAt`, `updatedAt`) with `@default(uuid())` and database indexes on `genre` and `available`, alongside [`prisma.config.ts`](./prisma.config.ts) for Prisma 7 CLI configuration and [`prisma/seed.ts`](./prisma/seed.ts) for idempotent initial seeding via `upsert`.
- **Design Decision Verified**: Using `String @id @default(uuid())` (PostgreSQL `TEXT` primary key) allows newly created books to receive automatic UUIDs while preserving compatibility with existing string IDs (such as seeded IDs `"1"`, `"2"`, `"3"` in Postman) and returning clean `404 Not Found` responses on non-existent IDs instead of database UUID cast errors.

### B. Replacing In-Memory Storage with PostgreSQL & Prisma CRUD
- **How AI Was Used**:
  - Created [`src/lib/prisma.ts`](./src/lib/prisma.ts) initializing `PrismaClient` with `@prisma/adapter-pg` connected via `DATABASE_URL`.
  - Refactored [`src/services/book.service.ts`](./src/services/book.service.ts) to remove the in-memory `Book[]` array and implement all 5 CRUD operations using Prisma (`prisma.book.findMany`, `findUnique`, `create`, `update`, and `delete`), including PostgreSQL case-insensitive (`mode: "insensitive"`) filtering for `genre` and `search`.
  - Updated [`src/controllers/book.controller.ts`](./src/controllers/book.controller.ts) to `await` asynchronous service methods and added graceful `prisma.$disconnect()` shutdown handling in [`src/server.ts`](./src/server.ts).

### C. Preserving the Existing API Contract & Validation
- **How AI Was Used**: Kept all routes ([`src/routes/book.routes.ts`](./src/routes/book.routes.ts)), **Zod** schemas ([`src/schemas/book.schema.ts`](./src/schemas/book.schema.ts)), validation middleware ([`src/middlewares/validate.middleware.ts`](./src/middlewares/validate.middleware.ts)), status codes (`200`, `201`, `400`, `404`, `500`), and JSON response payloads (`{ success, count, message, data, errors }`) 100% identical to the original Session 4 API contract.

### D. Automated Integration & Persistence Testing
- **How AI Was Used**: Authored [`src/test-api.ts`](./src/test-api.ts) to execute 12 end-to-end assertions covering every endpoint, filtering query parameter, Zod validation failure (`400`), missing-resource error (`404`), direct Prisma/PostgreSQL row inspection, and persistence across a complete HTTP server stop-and-restart cycle.

---

## 2. Database Migration Verification

- **Database**: `library_books_db` on PostgreSQL 19 (`localhost:5432`)
- **Applied Migration**: [`prisma/migrations/20261126083224_init/migration.sql`](./prisma/migrations/20261126083224_init/migration.sql)

```sql
-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Book_genre_idx" ON "Book"("genre");

-- CreateIndex
CREATE INDEX "Book_available_idx" ON "Book"("available");
```

---

## 3. End-to-End & Persistence Verification Results

### TypeScript Compilation (`npm run build`)
- Executed `rimraf dist && tsc` -> **Exited with code `0` (0 type errors)**.

### Database Seeding (`npm run prisma:seed`)
```text
Seeding PostgreSQL database with initial books...
Database seeded successfully. Total books in database: 3
```

### Automated 12-Step API & Persistence Test Suite (`npm test`)
```text
Test server #1 listening on http://localhost:3099

[1/12] Testing GET / (Welcome / Health)...
  PASS -> Status: 200 | Message: Welcome to the Library Book Management API

[2/12] Testing GET /api/books...
  PASS -> Status: 200 | Count: 3

[3/12] Testing GET /api/books?available=true&search=Clean...
  PASS -> Status: 200 | Filtered Count: 1

[4/12] Testing POST /api/books (Valid Creation)...
  PASS -> Status: 201 | Created Book ID: e84e7733-ad11-4e8a-bc79-afcca9ad5225

[5/12] Testing POST /api/books (Invalid Payload -> 400)...
  PASS -> Status: 400 | Validation Errors: 2

[6/12] Testing GET /api/books/:id (Existing Book)...
  PASS -> Status: 200 | Retrieved Title: Refactoring: Improving the Design of Existing Code

[7/12] Testing GET /api/books/non-existent-id (404 Expected)...
  PASS -> Status: 404 | Message: Book with ID 'non-existent-id' not found

[8/12] Testing PATCH /api/books/:id (Valid Partial Update)...
  PASS -> Status: 200 | Updated Genre: Computer Science | Available: false

[9/12] Testing PATCH /api/books/:id (Empty Body -> 400)...
  PASS -> Status: 400 | Message: Validation failed

[10/12] Verifying Data Persistence Across Server Restart + Direct PostgreSQL Query...
  -> Server #1 stopped.
  -> Direct PostgreSQL query confirmed persisted row: e84e7733-ad11-4e8a-bc79-afcca9ad5225
  -> Fresh Server #2 started on port 3099
  PASS -> Book persisted across full server restart!

[11/12] Testing DELETE /api/books/:id...
  PASS -> Status: 200 | Message: Book with ID 'e84e7733-ad11-4e8a-bc79-afcca9ad5225' deleted successfully

[12/12] Testing GET /api/books/:id After Deletion (404 Expected)...
  PASS -> Status: 404 | Message: Book with ID 'e84e7733-ad11-4e8a-bc79-afcca9ad5225' not found

ALL 12 ENDPOINT & POSTGRESQL PERSISTENCE TESTS PASSED SUCCESSFULLY!
```

---

## 4. Human Review & Quality Assurance Summary

1. **Schema & SQL Inspection**: Verified that generated SQL types (`TEXT`, `BOOLEAN`, `TIMESTAMP(3)`), primary keys, and indexes accurately reflect the domain model.
2. **Contract Parity Check**: Verified every endpoint path, query parameter (`genre`, `available`, `search`), Zod field-level error array (`errors: [{ field, message }]`), and HTTP status code against the original Session 4 specification and Postman collection.
3. **True Persistence Proof**: Verified that data is stored in PostgreSQL rather than process memory by shutting down the Express HTTP server completely, querying PostgreSQL directly, spinning up a brand-new server instance, and retrieving the updated book state via HTTP.
