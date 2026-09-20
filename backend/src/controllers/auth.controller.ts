import type { RequestHandler } from "express";
import { z } from "zod";

import { UserModel } from "../models/user.model.js";
import {
  createSession,
  hashPassword,
  revokeSession,
  rotateSession,
  toPublicUser,
  verifyPassword,
} from "../services/auth.service.js";
import { AppError } from "../utils/app-error.js";
import { clearSessionCookies, setSessionCookies } from "../utils/cookies.js";

const sessionContext = (request: Parameters<RequestHandler>[0]) => ({
  userAgent: request.get("user-agent"),
  ipAddress: request.ip,
});

const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,30}$/),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72),
  privacyConsent: z.literal(true),
  unitsPreference: z.enum(["metric", "imperial"]).default("metric"),
});

const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1)
    .max(254)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(72),
});

const onboardingSchema = z.object({
  unitsPreference: z.enum(["metric", "imperial"]),
  themePreference: z.enum(["dark", "light"]).default("dark"),
  privacyConsent: z.literal(true),
});

export const register: RequestHandler = async (request, response) => {
  const input = registerSchema.parse(request.body);
  const existingUser = await UserModel.exists({
    $or: [{ email: input.email }, { username: input.username }],
  });

  if (existingUser) {
    throw new AppError(
      409,
      "An account already uses that email address or username",
      "ACCOUNT_EXISTS",
    );
  }

  const user = await UserModel.create({
    name: input.name,
    username: input.username,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    unitsPreference: input.unitsPreference,
    profileCompleted: true,
    consent: {
      privacyPolicy: true,
      acceptedAt: new Date(),
      policyVersion: "v1",
    },
  });

  const tokens = await createSession(user, sessionContext(request));
  setSessionCookies(response, tokens.accessToken, tokens.refreshToken);
  response.status(201).json({ data: { user: toPublicUser(user) } });
};

export const login: RequestHandler = async (request, response) => {
  const input = loginSchema.parse(request.body);
  const user = await UserModel.findOne({
    $or: [{ email: input.identifier }, { username: input.identifier }],
  }).select("+passwordHash");

  if (
    !user?.passwordHash ||
    !(await verifyPassword(input.password, user.passwordHash))
  ) {
    throw new AppError(
      401,
      "Incorrect username/email or password",
      "INVALID_CREDENTIALS",
    );
  }

  const tokens = await createSession(user, sessionContext(request));
  setSessionCookies(response, tokens.accessToken, tokens.refreshToken);
  response.status(200).json({ data: { user: toPublicUser(user) } });
};

export const logout: RequestHandler = async (request, response) => {
  await revokeSession(request.cookies.fittrack_refresh as string | undefined);
  clearSessionCookies(response);
  response.status(204).send();
};

export const refresh: RequestHandler = async (request, response) => {
  const refreshToken = request.cookies.fittrack_refresh as string | undefined;
  if (!refreshToken) {
    throw new AppError(
      401,
      "Your session has expired. Please sign in again.",
      "MISSING_REFRESH_TOKEN",
    );
  }

  const tokens = await rotateSession(refreshToken, sessionContext(request));
  setSessionCookies(response, tokens.accessToken, tokens.refreshToken);
  response.status(204).send();
};

export const currentUser: RequestHandler = async (request, response) => {
  const user = await UserModel.findById(request.auth?.userId);
  if (!user)
    throw new AppError(401, "User account no longer exists", "UNAUTHENTICATED");
  response.status(200).json({ data: { user: toPublicUser(user) } });
};

export const completeOnboarding: RequestHandler = async (request, response) => {
  const input = onboardingSchema.parse(request.body);
  const user = await UserModel.findById(request.auth?.userId);
  if (!user)
    throw new AppError(401, "User account no longer exists", "UNAUTHENTICATED");

  user.unitsPreference = input.unitsPreference;
  user.themePreference = input.themePreference;
  user.profileCompleted = true;
  user.consent = {
    privacyPolicy: true,
    acceptedAt: new Date(),
    policyVersion: "v1",
  };
  await user.save();

  response.status(200).json({ data: { user: toPublicUser(user) } });
};
