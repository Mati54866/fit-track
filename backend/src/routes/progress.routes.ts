import { Router } from "express";

import * as progressController from "../controllers/progress.controller.js";
import { requireAuth, requireCsrf } from "../middleware/auth.middleware.js";

export const progressRouter = Router();
progressRouter.use(requireAuth);
progressRouter.get("/", progressController.list);
progressRouter.post("/", requireCsrf, progressController.create);
progressRouter.get("/:id", progressController.getById);
progressRouter.patch("/:id", requireCsrf, progressController.update);
progressRouter.delete("/:id", requireCsrf, progressController.remove);
