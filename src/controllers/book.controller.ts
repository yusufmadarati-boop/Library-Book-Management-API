import { Request, Response, NextFunction } from "express";
import { bookService } from "../services/book.service.js";
import { AppError } from "../middlewares/validate.middleware.js";
import { CreateBookInput, UpdateBookInput } from "../schemas/book.schema.js";

export class BookController {
  /**
   * GET /api/books
   * Retrieve all books (supports optional genre, available, and search query params)
   */
  public getAllBooks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { genre, available, search } = req.query;

      let availableFilter: boolean | undefined = undefined;
      if (available !== undefined) {
        if (available === "true" || available === "1") availableFilter = true;
        else if (available === "false" || available === "0") availableFilter = false;
      }

      const books = await bookService.getAll({
        genre: typeof genre === "string" ? genre : undefined,
        available: availableFilter,
        search: typeof search === "string" ? search : undefined,
      });

      res.status(200).json({
        success: true,
        count: books.length,
        data: books,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/books/:id
   * Retrieve single book by ID
   */
  public getBookById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const book = await bookService.getById(id);

      if (!book) {
        throw new AppError(`Book with ID '${id}' not found`, 404);
      }

      res.status(200).json({
        success: true,
        data: book,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/books
   * Create a new book
   */
  public createBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as CreateBookInput;
      const newBook = await bookService.create(input);

      res.status(201).json({
        success: true,
        message: "Book created successfully",
        data: newBook,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/books/:id
   * Partially update a book by ID
   */
  public updateBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const input = req.body as UpdateBookInput;

      const updatedBook = await bookService.update(id, input);
      if (!updatedBook) {
        throw new AppError(`Book with ID '${id}' not found`, 404);
      }

      res.status(200).json({
        success: true,
        message: "Book updated successfully",
        data: updatedBook,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/books/:id
   * Delete a book by ID
   */
  public deleteBook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const isDeleted = await bookService.delete(id);

      if (!isDeleted) {
        throw new AppError(`Book with ID '${id}' not found`, 404);
      }

      res.status(200).json({
        success: true,
        message: `Book with ID '${id}' deleted successfully`,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const bookController = new BookController();
