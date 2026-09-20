import { Router } from "express";

import {
  avatarUpload,
  update,
  updateAvatar,
} from "../controllers/profile.controller.js";
import { requireAuth, requireCsrf } from "../middleware/auth.middleware.js";

export const profileRouter = Router();
profileRouter.use(requireAuth);
profileRouter.patch("/", requireCsrf, update);
profileRouter.post("/avatar", requireCsrf, avatarUpload, updateAvatar);
