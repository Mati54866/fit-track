import type { RequestHandler } from "express";
import multer from "multer";
import { z } from "zod";

import { UserModel } from "../models/user.model.js";
import { uploadAvatar } from "../services/avatar.service.js";
import { toPublicUser } from "../services/auth.service.js";
import { AppError } from "../utils/app-error.js";

export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) =>
    callback(null, file.mimetype.startsWith("image/")),
}).single("avatar");

const profileSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,30}$/)
    .optional(),
  unitsPreference: z.enum(["metric", "imperial"]).optional(),
  themePreference: z.enum(["dark", "light"]).optional(),
  notificationPreferences: z.object({ inApp: z.boolean() }).optional(),
});

export const update: RequestHandler = async (request, response) => {
  const user = await UserModel.findById(request.auth!.userId);
  if (!user)
    throw new AppError(401, "User account no longer exists", "UNAUTHENTICATED");
  Object.assign(user, profileSchema.parse(request.body));
  await user.save();
  response.status(200).json({ data: { user: toPublicUser(user) } });
};

export const updateAvatar: RequestHandler = async (request, response) => {
  if (!request.file)
    throw new AppError(422, "An image file is required", "AVATAR_REQUIRED");
  const user = await UserModel.findById(request.auth!.userId);
  if (!user)
    throw new AppError(401, "User account no longer exists", "UNAUTHENTICATED");
  const uploaded = await uploadAvatar(request.file.buffer);
  user.avatarUrl = uploaded.secure_url;
  await user.save();
  response.status(200).json({ data: { user: toPublicUser(user) } });
};
