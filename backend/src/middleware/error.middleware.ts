import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";
import { logger } from "../utils/logger.js";

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(
    new AppError(
      404,
      `Route ${request.method} ${request.originalUrl} was not found`,
      "NOT_FOUND",
    ),
  );
};

export const errorHandler: ErrorRequestHandler = (error, request, response, next) => {
  void next;
  if (error instanceof ZodError) {
    response.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "One or more fields are invalid",
        details: error.flatten(),
      },
    });
    return;
  }

  if (error?.name === "MongoServerError" && error.code === 11000) {
    const field = Object.keys(error.keyPattern ?? {})[0] ?? "field";
    response.status(409).json({
      error: {
        code: "DUPLICATE_VALUE",
        message: `${field} is already in use`,
      },
    });
    return;
  }

  const appError =
    error instanceof AppError
      ? error
      : new AppError(500, "An unexpected error occurred", "INTERNAL_ERROR");

  if (appError.statusCode >= 500) {
    logger.error(
      { err: error, requestId: request.id },
      "Unhandled request error",
    );
  }

  response.status(appError.statusCode).json({
    error: {
      code: appError.code,
      message: appError.message,
      ...(env.NODE_ENV !== "production" && appError.statusCode === 500
        ? { stack: error?.stack }
        : {}),
    },
  });
};
