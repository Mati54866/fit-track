import { Router } from "express";

import {
  exportData,
  removeAccount,
} from "../controllers/account.controller.js";
import { requireAuth, requireCsrf } from "../middleware/auth.middleware.js";

export const accountRouter = Router();
accountRouter.use(requireAuth);
accountRouter.get("/export", exportData);
accountRouter.delete("/", requireCsrf, removeAccount);
