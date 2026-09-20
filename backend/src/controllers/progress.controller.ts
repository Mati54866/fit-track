import type { RequestHandler } from "express";
import { z } from "zod";

import { ProgressEntryModel } from "../models/progress-entry.model.js";
import { evaluateGoalsForUser } from "../services/goal.service.js";
import { AppError } from "../utils/app-error.js";
import { objectIdSchema, paginationSchema } from "../utils/request.js";

const metricSchema = z.object({
  metricName: z.string().trim().min(1).max(100),
  value: z.number(),
  unit: z.string().trim().min(1).max(20),
});

const progressBaseSchema = z.object({
  date: z.coerce.date(),
  weight: z.number().nonnegative().optional(),
  measurements: z
    .record(z.string().min(1).max(40), z.number().nonnegative())
    .optional(),
  performanceMetrics: z.array(metricSchema).max(50).default([]),
});

const progressSchema = progressBaseSchema.refine(
  (input) =>
    input.weight !== undefined ||
    input.measurements ||
    input.performanceMetrics.length > 0,
  "At least one progress value is required",
);

const listSchema = paginationSchema.extend({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const list: RequestHandler = async (request, response) => {
  const input = listSchema.parse(request.query);
  const filter = {
    userId: request.auth!.userId,
    ...(input.from || input.to
      ? {
          date: {
            ...(input.from ? { $gte: input.from } : {}),
            ...(input.to ? { $lte: input.to } : {}),
          },
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    ProgressEntryModel.find(filter)
      .sort({ date: -1, _id: -1 })
      .skip((input.page - 1) * input.limit)
      .limit(input.limit),
    ProgressEntryModel.countDocuments(filter),
  ]);
  response
    .status(200)
    .json({
      data: {
        items,
        pagination: { page: input.page, limit: input.limit, total },
      },
    });
};

export const create: RequestHandler = async (request, response) => {
  const input = progressSchema.parse(request.body);
  const entry = await ProgressEntryModel.create({
    ...input,
    userId: request.auth!.userId,
  });
  await evaluateGoalsForUser(request.auth!.userId);
  response.status(201).json({ data: { entry } });
};

export const getById: RequestHandler = async (request, response) => {
  const entry = await ProgressEntryModel.findOne({
    _id: objectIdSchema.parse(request.params.id),
    userId: request.auth!.userId,
  });
  if (!entry)
    throw new AppError(404, "Progress entry was not found", "NOT_FOUND");
  response.status(200).json({ data: { entry } });
};

export const update: RequestHandler = async (request, response) => {
  const id = objectIdSchema.parse(request.params.id);
  const input = progressBaseSchema.partial().parse(request.body);
  const entry = await ProgressEntryModel.findOneAndUpdate(
    { _id: id, userId: request.auth!.userId },
    input,
    { new: true, runValidators: true },
  );
  if (!entry)
    throw new AppError(404, "Progress entry was not found", "NOT_FOUND");
  await evaluateGoalsForUser(request.auth!.userId);
  response.status(200).json({ data: { entry } });
};

export const remove: RequestHandler = async (request, response) => {
  const entry = await ProgressEntryModel.findOneAndDelete({
    _id: objectIdSchema.parse(request.params.id),
    userId: request.auth!.userId,
  });
  if (!entry)
    throw new AppError(404, "Progress entry was not found", "NOT_FOUND");
  response.status(204).send();
};
