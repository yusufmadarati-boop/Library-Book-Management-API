import { z } from "zod";

export const CreateBookSchema = z.object({
  title: z
    .string({
      required_error: "Title is required",
      invalid_type_error: "Title must be a string",
    })
    .trim()
    .min(1, "Title cannot be empty"),
  author: z
    .string({
      required_error: "Author is required",
      invalid_type_error: "Author must be a string",
    })
    .trim()
    .min(1, "Author cannot be empty"),
  genre: z
    .string({
      required_error: "Genre is required",
      invalid_type_error: "Genre must be a string",
    })
    .trim()
    .min(1, "Genre cannot be empty"),
  available: z
    .boolean({
      invalid_type_error: "Available must be a boolean",
    })
    .default(true),
});

export const UpdateBookSchema = z
  .object({
    title: z.string().trim().min(1, "Title cannot be empty").optional(),
    author: z.string().trim().min(1, "Author cannot be empty").optional(),
    genre: z.string().trim().min(1, "Genre cannot be empty").optional(),
    available: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.author !== undefined ||
      data.genre !== undefined ||
      data.available !== undefined,
    {
      message: "At least one field (title, author, genre, or available) must be provided for update",
    }
  );

export const BookIdParamSchema = z.object({
  id: z.string().trim().min(1, "Book ID is required"),
});

export type CreateBookInput = z.infer<typeof CreateBookSchema>;
export type UpdateBookInput = z.infer<typeof UpdateBookSchema>;
