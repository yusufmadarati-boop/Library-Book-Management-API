import { Request, Response, NextFunction } from "express";
import { ZodError, ZodType } from "zod";

export class AppError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Middleware factory to validate request body, query, or params using Zod
 */
export const validate = (schema: ZodType, target: "body" | "query" | "params" = "body") => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req[target]);
      if (target === "query") {
        Object.assign(req.query, parsed);
      } else {
        req[target] = parsed;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: issues,
        });
        return;
      }
      next(error);
    }
  };
};
