import { Router } from "express";

import * as reminderController from "../controllers/reminder.controller.js";
import { requireAuth, requireCsrf } from "../middleware/auth.middleware.js";

export const reminderRouter = Router();
reminderRouter.use(requireAuth);
reminderRouter.get("/", reminderController.list);
reminderRouter.post("/", requireCsrf, reminderController.create);
reminderRouter.patch("/:id", requireCsrf, reminderController.update);
reminderRouter.delete("/:id", requireCsrf, reminderController.remove);
