import { Router } from "express";
import { bookController } from "../controllers/book.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  CreateBookSchema,
  UpdateBookSchema,
  BookIdParamSchema,
} from "../schemas/book.schema.js";

const router = Router();

// 1. GET /api/books - Get all books
router.get("/", bookController.getAllBooks);

// 2. GET /api/books/:id - Get single book by ID
router.get("/:id", validate(BookIdParamSchema, "params"), bookController.getBookById);

// 3. POST /api/books - Create new book (validated with Zod)
router.post("/", validate(CreateBookSchema, "body"), bookController.createBook);

// 4. PATCH /api/books/:id - Partially update book (validated with Zod)
router.patch(
  "/:id",
  validate(BookIdParamSchema, "params"),
  validate(UpdateBookSchema, "body"),
  bookController.updateBook
);

// 5. DELETE /api/books/:id - Delete book by ID
router.delete("/:id", validate(BookIdParamSchema, "params"), bookController.deleteBook);

export default router;
