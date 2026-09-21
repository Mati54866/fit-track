import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  currentUser,
  completeOnboarding,
  login,
  logout,
  refresh,
  register,
} from "../controllers/auth.controller.js";
import { passport } from "../config/passport.js";
import { env } from "../config/env.js";
import { requireAuth, requireCsrf } from "../middleware/auth.middleware.js";
import { createReauthenticationToken, createSession } from "../services/auth.service.js";
import { setReauthenticationCookie, setSessionCookies } from "../utils/cookies.js";

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1_000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: {
      code: "TOO_MANY_ATTEMPTS",
      message: "Too many attempts. Try again in 15 minutes.",
    },
  },
});

export const authRouter = Router();

authRouter.post("/register", authRateLimit, requireCsrf, register);
authRouter.post("/login", authRateLimit, requireCsrf, login);
authRouter.post("/refresh", authRateLimit, requireCsrf, refresh);
authRouter.post("/logout", requireCsrf, logout);
authRouter.get("/me", requireAuth, currentUser);
authRouter.patch("/onboarding", requireAuth, requireCsrf, completeOnboarding);

authRouter.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);
authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${env.CLIENT_ORIGIN}/login?error=google_auth_failed`,
  }),
  async (request, response) => {
    const user = request.user as Parameters<typeof createSession>[0];
    const tokens = await createSession(user, {
      userAgent: request.get("user-agent"),
      ipAddress: request.ip,
    });
    setSessionCookies(response, tokens.accessToken, tokens.refreshToken);
    response.redirect(
      `${env.CLIENT_ORIGIN}${user.profileCompleted ? "/dashboard" : "/onboarding"}`,
    );
  },
);

authRouter.get(
  "/google/reconfirm",
  requireAuth,
  passport.authenticate("google", { scope: ["profile", "email"], prompt: "select_account", session: false }),
);
authRouter.get(
  "/google/reconfirm/callback",
  requireAuth,
  passport.authenticate("google", { session: false, failureRedirect: `${env.CLIENT_ORIGIN}/settings?error=google_reauth_failed` }),
  (request, response) => {
    const confirmedUser = request.user as Parameters<typeof createSession>[0];
    if (confirmedUser.id !== request.auth!.userId) {
      response.redirect(`${env.CLIENT_ORIGIN}/settings?error=google_account_mismatch`);
      return;
    }
    setReauthenticationCookie(response, createReauthenticationToken(confirmedUser.id));
    response.redirect(`${env.CLIENT_ORIGIN}/settings?account_reconfirmed=true`);
  },
);
