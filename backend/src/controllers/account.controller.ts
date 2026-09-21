import type { RequestHandler } from "express";
import { z } from "zod";

import { deleteUserData, exportUserData } from "../services/account.service.js";
import { UserModel } from "../models/user.model.js";
import { verifyPassword, verifyReauthenticationToken } from "../services/auth.service.js";
import { AppError } from "../utils/app-error.js";
import { clearReauthenticationCookie, clearSessionCookies } from "../utils/cookies.js";

export const exportData: RequestHandler = async (request, response) => {
  const data = await exportUserData(request.auth!.userId);
  response.attachment("fittrack-personal-data.json").status(200).json(data);
};

export const removeAccount: RequestHandler = async (request, response) => {
  const input = z.object({ confirmation: z.literal("DELETE"), password: z.string().min(1).max(72).optional() }).parse(request.body);
  const user = await UserModel.findById(request.auth!.userId).select("+passwordHash");
  if (!user) throw new AppError(401, "User account no longer exists", "UNAUTHENTICATED");
  const passwordConfirmed = Boolean(user.passwordHash && input.password && await verifyPassword(input.password, user.passwordHash));
  const googleConfirmed = verifyReauthenticationToken(request.cookies.fittrack_reauth as string | undefined, user.id);
  if (!passwordConfirmed && !googleConfirmed) {
    throw new AppError(403, "Re-enter your password or reconfirm with Google before deleting your account", "REAUTHENTICATION_REQUIRED");
  }
  await deleteUserData(request.auth!.userId);
  clearSessionCookies(response);
  clearReauthenticationCookie(response);
  response.status(204).send();
};
