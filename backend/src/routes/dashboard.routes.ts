import { Router } from "express";

import { get } from "../controllers/dashboard.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const dashboardRouter = Router();
dashboardRouter.get("/", requireAuth, get);
