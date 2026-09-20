import { Router } from "express";

import * as notificationController from "../controllers/notification.controller.js";
import { requireAuth, requireCsrf } from "../middleware/auth.middleware.js";

export const notificationRouter = Router();
notificationRouter.use(requireAuth);
notificationRouter.get("/", notificationController.list);
notificationRouter.patch(
  "/read-all",
  requireCsrf,
  notificationController.markAllRead,
);
notificationRouter.patch("/:id", requireCsrf, notificationController.markRead);
