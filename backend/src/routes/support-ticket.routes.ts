import { Router } from "express";

import * as ticketController from "../controllers/support-ticket.controller.js";
import { requireAuth, requireCsrf } from "../middleware/auth.middleware.js";

export const supportTicketRouter = Router();
supportTicketRouter.use(requireAuth);
supportTicketRouter.get("/", ticketController.list);
supportTicketRouter.post("/", requireCsrf, ticketController.create);
