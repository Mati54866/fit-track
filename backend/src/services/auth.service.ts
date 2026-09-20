import bcrypt from "bcryptjs";
import { createHash, randomUUID } from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "../config/env.js";
import { RefreshSessionModel } from "../models/refresh-session.model.js";
import { UserModel, type UserDocument } from "../models/user.model.js";
import { AppError } from "../utils/app-error.js";
import { parseDurationToMilliseconds } from "../utils/cookies.js";

const USERNAME_SUFFIX_LENGTH = 5;

const normalizeUsername = (value: string): string => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 25);
  return normalized.length >= 3 ? normalized : "fittrack";
};

export const createUniqueUsername = async (
  candidate: string,
): Promise<string> => {
  const base = normalizeUsername(candidate);
  const exactMatch = await UserModel.exists({ username: base });

  if (!exactMatch) {
    return base;
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = Math.random()
      .toString(36)
      .slice(2, 2 + USERNAME_SUFFIX_LENGTH);
    const username = `${base.slice(0, 30 - suffix.length - 1)}_${suffix}`;
    const match = await UserModel.exists({ username });
    if (!match) return username;
  }

  throw new AppError(
    503,
    "Could not create a unique username. Please try again.",
    "USERNAME_GENERATION_FAILED",
  );
};

export const hashPassword = async (password: string): Promise<string> =>
  bcrypt.hash(password, 12);

export const verifyPassword = async (
  password: string,
  passwordHash: string,
): Promise<boolean> => bcrypt.compare(password, passwordHash);

export const createAccessToken = (user: UserDocument): string =>
  jwt.sign({ sub: user.id }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL as SignOptions["expiresIn"],
  });

const hashRefreshToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

type SessionContext = {
  userAgent?: string;
  ipAddress?: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export const createSession = async (
  user: UserDocument,
  context: SessionContext,
): Promise<AuthTokens> => {
  const sessionId = randomUUID();
  const refreshToken = jwt.sign(
    { sub: user.id, sid: sessionId, tokenType: "refresh" },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_TTL as SignOptions["expiresIn"] },
  );

  await RefreshSessionModel.create({
    userId: user._id,
    sessionId,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: new Date(
      Date.now() + parseDurationToMilliseconds(env.JWT_REFRESH_TTL),
    ),
    userAgent: context.userAgent?.slice(0, 500),
    ipAddress: context.ipAddress,
  });

  return { accessToken: createAccessToken(user), refreshToken };
};

const getRefreshClaims = (
  token: string,
): { userId: string; sessionId: string } => {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
    if (
      typeof payload === "string" ||
      payload.tokenType !== "refresh" ||
      !payload.sub ||
      typeof payload.sid !== "string"
    ) {
      throw new Error("Invalid refresh token claims");
    }
    return { userId: payload.sub, sessionId: payload.sid };
  } catch {
    throw new AppError(
      401,
      "Your session has expired. Please sign in again.",
      "INVALID_REFRESH_TOKEN",
    );
  }
};

export const rotateSession = async (
  rawRefreshToken: string,
  context: SessionContext,
): Promise<AuthTokens> => {
  const { userId, sessionId } = getRefreshClaims(rawRefreshToken);
  const session = await RefreshSessionModel.findOne({ sessionId }).select(
    "+tokenHash",
  );

  if (
    !session ||
    session.userId.toString() !== userId ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    session.tokenHash !== hashRefreshToken(rawRefreshToken)
  ) {
    if (session)
      await RefreshSessionModel.deleteMany({ userId: session.userId });
    throw new AppError(
      401,
      "Your session is no longer valid. Please sign in again.",
      "REFRESH_TOKEN_REUSED",
    );
  }

  session.revokedAt = new Date();
  await session.save();

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError(401, "User account no longer exists", "UNAUTHENTICATED");
  }

  return createSession(user, context);
};

export const revokeSession = async (
  rawRefreshToken?: string,
): Promise<void> => {
  if (!rawRefreshToken) return;

  try {
    const { sessionId } = getRefreshClaims(rawRefreshToken);
    await RefreshSessionModel.updateOne(
      {
        sessionId,
        tokenHash: hashRefreshToken(rawRefreshToken),
        revokedAt: { $exists: false },
      },
      { $set: { revokedAt: new Date() } },
    );
  } catch {
    // Always clear cookies, even if the refresh token is already invalid.
  }
};

export const toPublicUser = (user: UserDocument) => ({
  id: user.id,
  name: user.name,
  username: user.username,
  email: user.email,
  avatarUrl: user.avatarUrl,
  unitsPreference: user.unitsPreference,
  themePreference: user.themePreference,
  notificationPreferences: user.notificationPreferences,
  profileCompleted: user.profileCompleted,
});
