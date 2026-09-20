import { Router } from "express";

import * as nutritionController from "../controllers/nutrition.controller.js";
import { requireAuth, requireCsrf } from "../middleware/auth.middleware.js";

export const nutritionRouter = Router();

nutritionRouter.use(requireAuth);
nutritionRouter.get("/", nutritionController.list);
nutritionRouter.post("/", requireCsrf, nutritionController.create);
nutritionRouter.get("/:id", nutritionController.getById);
nutritionRouter.patch("/:id", requireCsrf, nutritionController.update);
nutritionRouter.delete("/:id", requireCsrf, nutritionController.remove);
