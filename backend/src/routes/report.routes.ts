import { Router } from "express";

import { exportReport } from "../controllers/report.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const reportRouter = Router();
reportRouter.get("/export", requireAuth, exportReport);
