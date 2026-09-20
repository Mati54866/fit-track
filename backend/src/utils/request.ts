import { z } from "zod";

import { AppError } from "./app-error.js";

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid resource ID");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const getPagination = (page: number, limit: number) => ({
  skip: (page - 1) * limit,
  limit,
});

export const requireOwnedDocument = <T extends { userId: { toString(): string } }>(
  document: T | null,
  userId: string,
  resourceName: string,
): T => {
  if (!document || document.userId.toString() !== userId) {
    throw new AppError(404, `${resourceName} was not found`, "NOT_FOUND");
  }
  return document;
};
