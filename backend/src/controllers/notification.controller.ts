import type { RequestHandler } from "express";
import { z } from "zod";

import { NotificationModel } from "../models/notification.model.js";
import { AppError } from "../utils/app-error.js";
import { objectIdSchema, paginationSchema } from "../utils/request.js";

export const list: RequestHandler = async (request, response) => {
  const { page, limit } = paginationSchema.parse(request.query);
  const [items, total] = await Promise.all([
    NotificationModel.find({ userId: request.auth!.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    NotificationModel.countDocuments({ userId: request.auth!.userId }),
  ]);
  response
    .status(200)
    .json({ data: { items, pagination: { page, limit, total } } });
};

export const markRead: RequestHandler = async (request, response) => {
  const notification = await NotificationModel.findOneAndUpdate(
    {
      _id: objectIdSchema.parse(request.params.id),
      userId: request.auth!.userId,
    },
    { read: z.boolean().default(true).parse(request.body.read) },
    { new: true },
  );
  if (!notification)
    throw new AppError(404, "Notification was not found", "NOT_FOUND");
  response.status(200).json({ data: { notification } });
};

export const markAllRead: RequestHandler = async (request, response) => {
  await NotificationModel.updateMany(
    { userId: request.auth!.userId, read: false },
    { $set: { read: true } },
  );
  response.status(204).send();
};
