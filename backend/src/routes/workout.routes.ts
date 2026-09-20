import { Router } from "express";

import * as workoutController from "../controllers/workout.controller.js";
import { requireAuth, requireCsrf } from "../middleware/auth.middleware.js";

export const workoutRouter = Router();

workoutRouter.use(requireAuth);
workoutRouter.get("/", workoutController.list);
workoutRouter.post("/", requireCsrf, workoutController.create);
workoutRouter.get("/:id", workoutController.getById);
workoutRouter.patch("/:id", requireCsrf, workoutController.update);
workoutRouter.delete("/:id", requireCsrf, workoutController.remove);
