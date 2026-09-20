import { Router } from "express";

import * as goalController from "../controllers/goal.controller.js";
import { requireAuth, requireCsrf } from "../middleware/auth.middleware.js";

export const goalRouter = Router();
goalRouter.use(requireAuth);
goalRouter.get("/", goalController.list);
goalRouter.post("/", requireCsrf, goalController.create);
goalRouter.patch("/:id", requireCsrf, goalController.update);
goalRouter.delete("/:id", requireCsrf, goalController.remove);
