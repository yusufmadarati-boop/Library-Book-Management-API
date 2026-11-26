import assert from "node:assert/strict";
import http from "node:http";
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";

async function startTestServer(port: number): Promise<http.Server> {
  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(port, () => resolve()));
  return server;
}

async function stopTestServer(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve()))
  );
}

async function runTests() {
  const port = 3099;
  const baseUrl = `http://localhost:${port}`;
  let server = await startTestServer(port);
  console.log(`Test server #1 listening on ${baseUrl}`);

  let createdBookId = "";

  try {
    // 1. GET / (Health & Welcome)
    console.log("\n[1/12] Testing GET / (Welcome / Health)...");
    let res = await fetch(`${baseUrl}/`);
    let body: any = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    console.log("  PASS -> Status:", res.status, "| Message:", body.message);

    // 2. GET /api/books (All seeded books)
    console.log("\n[2/12] Testing GET /api/books...");
    res = await fetch(`${baseUrl}/api/books`);
    body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data) && body.data.length >= 3, "Expected seeded books in DB");
    console.log("  PASS -> Status:", res.status, "| Count:", body.count);

    // 3. GET /api/books with filters (?available=true&search=Clean)
    console.log("\n[3/12] Testing GET /api/books?available=true&search=Clean...");
    res = await fetch(`${baseUrl}/api/books?available=true&search=Clean`);
    body = await res.json();
    assert.equal(res.status, 200);
    assert.ok(body.count >= 1);
    assert.ok(body.data.some((b: any) => b.title === "Clean Code"));
    console.log("  PASS -> Status:", res.status, "| Filtered Count:", body.count);

    // 4. POST /api/books (Valid)
    console.log("\n[4/12] Testing POST /api/books (Valid Creation)...");
    res = await fetch(`${baseUrl}/api/books`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Refactoring: Improving the Design of Existing Code",
        author: "Martin Fowler",
        genre: "Software Design",
        available: true,
      }),
    });
    body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.message, "Book created successfully");
    assert.ok(body.data?.id);
    createdBookId = body.data.id;
    console.log("  PASS -> Status:", res.status, "| Created Book ID:", createdBookId);

    // 5. POST /api/books (Invalid - Zod validation failure -> 400)
    console.log("\n[5/12] Testing POST /api/books (Invalid Payload -> 400)...");
    res = await fetch(`${baseUrl}/api/books`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "",
        genre: "Software Design",
      }),
    });
    body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
    assert.ok(Array.isArray(body.errors) && body.errors.length >= 2);
    console.log("  PASS -> Status:", res.status, "| Validation Errors:", body.errors.length);

    // 6. GET /api/books/:id (Existing)
    console.log("\n[6/12] Testing GET /api/books/:id (Existing Book)...");
    res = await fetch(`${baseUrl}/api/books/${createdBookId}`);
    body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.data.id, createdBookId);
    assert.equal(body.data.author, "Martin Fowler");
    console.log("  PASS -> Status:", res.status, "| Retrieved Title:", body.data.title);

    // 7. GET /api/books/:id (Non-existent -> 404)
    console.log("\n[7/12] Testing GET /api/books/non-existent-id (404 Expected)...");
    res = await fetch(`${baseUrl}/api/books/non-existent-id`);
    body = await res.json();
    assert.equal(res.status, 404);
    assert.equal(body.success, false);
    console.log("  PASS -> Status:", res.status, "| Message:", body.message);

    // 8. PATCH /api/books/:id (Valid Partial Update)
    console.log("\n[8/12] Testing PATCH /api/books/:id (Valid Partial Update)...");
    res = await fetch(`${baseUrl}/api/books/${createdBookId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        available: false,
        genre: "Computer Science",
      }),
    });
    body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.data.available, false);
    assert.equal(body.data.genre, "Computer Science");
    console.log("  PASS -> Status:", res.status, "| Updated Genre:", body.data.genre, "| Available:", body.data.available);

    // 9. PATCH /api/books/:id (Empty Body -> 400 Validation Error)
    console.log("\n[9/12] Testing PATCH /api/books/:id (Empty Body -> 400)...");
    res = await fetch(`${baseUrl}/api/books/${createdBookId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    console.log("  PASS -> Status:", res.status, "| Message:", body.message);

    // 10. PERSISTENCE VERIFICATION: Stop Server #1, Start Fresh Server #2, and Query PostgreSQL
    console.log("\n[10/12] Verifying Data Persistence Across Server Restart + Direct PostgreSQL Query...");
    await stopTestServer(server);
    console.log("  -> Server #1 stopped.");

    const dbRecord = await prisma.book.findUnique({ where: { id: createdBookId } });
    assert.ok(dbRecord, "Book record must exist directly in PostgreSQL table");
    assert.equal(dbRecord.genre, "Computer Science");
    assert.equal(dbRecord.available, false);
    console.log("  -> Direct PostgreSQL query confirmed persisted row:", dbRecord.id);

    server = await startTestServer(port);
    console.log("  -> Fresh Server #2 started on port", port);

    res = await fetch(`${baseUrl}/api/books/${createdBookId}`);
    body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.data.id, createdBookId);
    assert.equal(body.data.genre, "Computer Science");
    assert.equal(body.data.available, false);
    console.log("  PASS -> Book persisted across full server restart!");

    // 11. DELETE /api/books/:id
    console.log("\n[11/12] Testing DELETE /api/books/:id...");
    res = await fetch(`${baseUrl}/api/books/${createdBookId}`, {
      method: "DELETE",
    });
    body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.success, true);
    console.log("  PASS -> Status:", res.status, "| Message:", body.message);

    // 12. GET /api/books/:id after deletion (404 Expected)
    console.log("\n[12/12] Testing GET /api/books/:id After Deletion (404 Expected)...");
    res = await fetch(`${baseUrl}/api/books/${createdBookId}`);
    body = await res.json();
    assert.equal(res.status, 404);
    assert.equal(body.success, false);
    console.log("  PASS -> Status:", res.status, "| Message:", body.message);

    console.log("\nALL 12 ENDPOINT & POSTGRESQL PERSISTENCE TESTS PASSED SUCCESSFULLY!");
  } finally {
    await stopTestServer(server).catch(() => {});
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error("Test suite failed:", err);
  process.exit(1);
});
