import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { AppError } from "./validate.middleware.js";

/**
 * 404 Not Found Middleware for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Global Error Handling Middleware
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Handle JSON parsing syntax error
  if ("type" in err && err.type === "entity.parse.failed") {
    res.status(400).json({
      success: false,
      message: "Malformed JSON payload in request body",
    });
    return;
  }

  // Handle Prisma record-not-found error (P2025) gracefully
  if ("code" in err && (err as { code?: string }).code === "P2025") {
    res.status(404).json({
      success: false,
      message: "Requested book record was not found",
    });
    return;
  }

  console.error("Unhandled Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" ? { error: err.message } : {}),
  });
};
