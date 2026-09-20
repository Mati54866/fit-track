import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";

import { env } from "./config/env.js";
import { passport } from "./config/passport.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware.js";
import { authRouter } from "./routes/auth.routes.js";
import { nutritionRouter } from "./routes/nutrition.routes.js";
import { progressRouter } from "./routes/progress.routes.js";
import { goalRouter } from "./routes/goal.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { notificationRouter } from "./routes/notification.routes.js";
import { reminderRouter } from "./routes/reminder.routes.js";
import { supportTicketRouter } from "./routes/support-ticket.routes.js";
import { profileRouter } from "./routes/profile.routes.js";
import { accountRouter } from "./routes/account.routes.js";
import { analyticsRouter } from "./routes/analytics.routes.js";
import { reportRouter } from "./routes/report.routes.js";
import { workoutRouter } from "./routes/workout.routes.js";
import { logger } from "./utils/logger.js";

export const app = express();

app.disable("x-powered-by");
app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(passport.initialize());

app.get("/health", (_request, response) =>
  response.status(200).json({ status: "ok" }),
);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/workouts", workoutRouter);
app.use("/api/v1/nutrition", nutritionRouter);
app.use("/api/v1/progress", progressRouter);
app.use("/api/v1/goals", goalRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/reminders", reminderRouter);
app.use("/api/v1/support-tickets", supportTicketRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/account", accountRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/reports", reportRouter);

app.use(notFoundHandler);
app.use(errorHandler);
