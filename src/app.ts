import express, { Application, Request, Response } from "express";
import cors from "cors";
import bookRoutes from "./routes/book.routes.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

export const createApp = (): Application => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Root health / welcome route
  app.get("/", (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: "Welcome to the Library Book Management API",
      version: "2.0.0",
      storage: "PostgreSQL + Prisma ORM",
      documentation: "/api/books",
      endpoints: {
        "GET /api/books": "Retrieve all books (supports ?genre=&available=&search=)",
        "GET /api/books/:id": "Retrieve book by ID",
        "POST /api/books": "Create a new book (validated with Zod)",
        "PATCH /api/books/:id": "Partially update a book (validated with Zod)",
        "DELETE /api/books/:id": "Delete a book by ID",
      },
    });
  });

  // API Routes
  app.use("/api/books", bookRoutes);

  // 404 Handler for undefined routes
  app.use(notFoundHandler);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
