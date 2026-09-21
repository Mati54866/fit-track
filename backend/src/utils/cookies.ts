import type { CookieOptions, Response } from "express";

import { env } from "../config/env.js";

export const parseDurationToMilliseconds = (duration: string): number => {
  const match = /^(\d+)(m|h|d)$/.exec(duration);

  if (!match) {
    throw new Error(
      "JWT_ACCESS_TTL must use a whole-number m, h, or d unit (for example 8h)",
    );
  }

  const [, amount, unit] = match;
  const multiplier =
    unit === "m" ? 60_000 : unit === "h" ? 3_600_000 : 86_400_000;
  return Number(amount) * multiplier;
};

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
  path: "/",
};

export const setAccessCookie = (response: Response, token: string): void => {
  response.cookie("fittrack_access", token, {
    ...baseCookieOptions,
    maxAge: parseDurationToMilliseconds(env.JWT_ACCESS_TTL),
  });
};

export const setRefreshCookie = (response: Response, token: string): void => {
  response.cookie("fittrack_refresh", token, {
    ...baseCookieOptions,
    path: "/api/v1/auth",
    maxAge: parseDurationToMilliseconds(env.JWT_REFRESH_TTL),
  });
};

export const clearAccessCookie = (response: Response): void => {
  response.clearCookie("fittrack_access", baseCookieOptions);
};

export const clearRefreshCookie = (response: Response): void => {
  response.clearCookie("fittrack_refresh", {
    ...baseCookieOptions,
    path: "/api/v1/auth",
  });
};

export const setReauthenticationCookie = (response: Response, token: string): void => {
  response.cookie("fittrack_reauth", token, {
    ...baseCookieOptions,
    path: "/api/v1/account",
    maxAge: 5 * 60_000,
  });
};

export const clearReauthenticationCookie = (response: Response): void => {
  response.clearCookie("fittrack_reauth", { ...baseCookieOptions, path: "/api/v1/account" });
};

export const setSessionCookies = (
  response: Response,
  accessToken: string,
  refreshToken: string,
): void => {
  setAccessCookie(response, accessToken);
  setRefreshCookie(response, refreshToken);
};

export const clearSessionCookies = (response: Response): void => {
  clearAccessCookie(response);
  clearRefreshCookie(response);
};
