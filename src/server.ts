import "dotenv/config";
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";

const PORT = process.env.PORT || 3000;
const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`Library Book Management API (Prisma + PostgreSQL) is running on port ${PORT}`);
  console.log(`API base URL: http://localhost:${PORT}/api/books`);
  console.log(`Health check: http://localhost:${PORT}/`);
});

const shutdown = async () => {
  console.log("Shutting down server and disconnecting Prisma...");
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
