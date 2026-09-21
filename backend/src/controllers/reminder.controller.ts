import type { RequestHandler } from "express";
import { z } from "zod";

import { ReminderModel } from "../models/reminder.model.js";
import { triggerDueReminders } from "../services/reminder.service.js";
import { AppError } from "../utils/app-error.js";
import { objectIdSchema } from "../utils/request.js";

const reminderSchema = z.object({
  title: z.string().trim().min(1).max(120),
  linkedGoalId: objectIdSchema.optional(),
  dueAt: z.coerce.date(),
  repeatRule: z.enum(["none", "daily", "weekly", "monthly"]).default("none"),
  enabled: z.boolean().default(true),
});

export const list: RequestHandler = async (request, response) => {
  await triggerDueReminders(request.auth!.userId);
  const items = await ReminderModel.find({ userId: request.auth!.userId }).sort(
    { enabled: -1, dueAt: 1 },
  );
  response.status(200).json({ data: { items } });
};

export const create: RequestHandler = async (request, response) => {
  const reminder = await ReminderModel.create({
    ...reminderSchema.parse(request.body),
    userId: request.auth!.userId,
  });
  response.status(201).json({ data: { reminder } });
};

export const update: RequestHandler = async (request, response) => {
  const reminder = await ReminderModel.findOneAndUpdate(
    {
      _id: objectIdSchema.parse(request.params.id),
      userId: request.auth!.userId,
    },
    reminderSchema.partial().parse(request.body),
    { new: true, runValidators: true },
  );
  if (!reminder) throw new AppError(404, "Reminder was not found", "NOT_FOUND");
  response.status(200).json({ data: { reminder } });
};

export const remove: RequestHandler = async (request, response) => {
  const reminder = await ReminderModel.findOneAndDelete({
    _id: objectIdSchema.parse(request.params.id),
    userId: request.auth!.userId,
  });
  if (!reminder) throw new AppError(404, "Reminder was not found", "NOT_FOUND");
  response.status(204).send();
};
