import { Router } from "express";

import * as analyticsController from "../controllers/analytics.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);
analyticsRouter.get("/workouts", analyticsController.workouts);
analyticsRouter.get("/nutrition", analyticsController.nutrition);
analyticsRouter.get("/progress", analyticsController.progress);
