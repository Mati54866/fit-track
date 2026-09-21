import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

export const requireAuth = (
  request: Request,
  _response: Response,
  next: NextFunction,
): void => {
  const token = request.cookies.fittrack_access as string | undefined;

  if (!token) {
    next(new AppError(401, "Authentication is required", "UNAUTHENTICATED"));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);

    if (typeof payload === "string" || !payload.sub) {
      throw new AppError(401, "Invalid authentication token", "INVALID_TOKEN");
    }

    request.auth = { userId: payload.sub };
    next();
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(
            401,
            "Your session has expired. Please sign in again.",
            "INVALID_TOKEN",
          ),
    );
  }
};

export const requireCsrf = (
  request: Request,
  _response: Response,
  next: NextFunction,
): void => {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    next();
    return;
  }

  const origin = request.get("origin");
  if (origin && origin !== env.CLIENT_ORIGIN) {
    next(new AppError(403, "Request origin is not allowed", "INVALID_ORIGIN"));
    return;
  }

  next();
};
