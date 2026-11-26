import { prisma } from "../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { Book } from "../models/book.model.js";
import type { CreateBookInput, UpdateBookInput } from "../schemas/book.schema.js";

export class BookService {
  /**
   * Retrieve all books from PostgreSQL with optional filtering
   */
  public async getAll(filter?: {
    genre?: string;
    available?: boolean;
    search?: string;
  }): Promise<Book[]> {
    const where: Prisma.BookWhereInput = {};

    if (filter) {
      if (filter.genre) {
        where.genre = {
          equals: filter.genre,
          mode: "insensitive",
        };
      }

      if (filter.available !== undefined) {
        where.available = filter.available;
      }

      if (filter.search) {
        where.OR = [
          { title: { contains: filter.search, mode: "insensitive" } },
          { author: { contains: filter.search, mode: "insensitive" } },
          { genre: { contains: filter.search, mode: "insensitive" } },
        ];
      }
    }

    return prisma.book.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Retrieve a single book by ID from PostgreSQL
   */
  public async getById(id: string): Promise<Book | null> {
    return prisma.book.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new book in PostgreSQL
   */
  public async create(data: CreateBookInput): Promise<Book> {
    return prisma.book.create({
      data: {
        title: data.title,
        author: data.author,
        genre: data.genre,
        available: data.available ?? true,
      },
    });
  }

  /**
   * Partially update an existing book by ID in PostgreSQL
   */
  public async update(id: string, data: UpdateBookInput): Promise<Book | null> {
    const existingBook = await prisma.book.findUnique({
      where: { id },
    });

    if (!existingBook) {
      return null;
    }

    return prisma.book.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.author !== undefined && { author: data.author }),
        ...(data.genre !== undefined && { genre: data.genre }),
        ...(data.available !== undefined && { available: data.available }),
      },
    });
  }

  /**
   * Delete a book by ID from PostgreSQL
   */
  public async delete(id: string): Promise<boolean> {
    const existingBook = await prisma.book.findUnique({
      where: { id },
    });

    if (!existingBook) {
      return false;
    }

    await prisma.book.delete({
      where: { id },
    });

    return true;
  }
}

// Export singleton instance
export const bookService = new BookService();
