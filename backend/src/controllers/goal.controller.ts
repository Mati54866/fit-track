import type { RequestHandler } from "express";
import { z } from "zod";

import { GoalModel } from "../models/goal.model.js";
import { AppError } from "../utils/app-error.js";
import { objectIdSchema } from "../utils/request.js";

const goalBaseSchema = z.object({
  type: z.enum([
    "workout_count",
    "calories",
    "protein",
    "carbs",
    "fat",
    "weight",
  ]),
  targetValue: z.number().nonnegative(),
  period: z.enum(["daily", "weekly", "monthly", "one_time"]),
  deadline: z.coerce.date().optional(),
  weightDirection: z.enum(["lose", "gain"]).optional(),
});

const goalSchema = goalBaseSchema.superRefine((input, context) => {
  if (input.type === "weight" && !input.weightDirection)
    context.addIssue({
      code: "custom",
      path: ["weightDirection"],
      message: "Weight goals require weightDirection",
    });
  if (input.type !== "weight" && input.weightDirection)
    context.addIssue({
      code: "custom",
      path: ["weightDirection"],
      message: "weightDirection is only valid for weight goals",
    });
});

export const list: RequestHandler = async (request, response) => {
  const items = await GoalModel.find({ userId: request.auth!.userId }).sort({
    achieved: 1,
    createdAt: -1,
  });
  response.status(200).json({ data: { items } });
};

export const create: RequestHandler = async (request, response) => {
  const goal = await GoalModel.create({
    ...goalSchema.parse(request.body),
    userId: request.auth!.userId,
  });
  response.status(201).json({ data: { goal } });
};

export const update: RequestHandler = async (request, response) => {
  const input = goalBaseSchema.partial().parse(request.body);
  const goal = await GoalModel.findOneAndUpdate(
    {
      _id: objectIdSchema.parse(request.params.id),
      userId: request.auth!.userId,
    },
    input,
    { new: true, runValidators: true },
  );
  if (!goal) throw new AppError(404, "Goal was not found", "NOT_FOUND");
  response.status(200).json({ data: { goal } });
};

export const remove: RequestHandler = async (request, response) => {
  const goal = await GoalModel.findOneAndDelete({
    _id: objectIdSchema.parse(request.params.id),
    userId: request.auth!.userId,
  });
  if (!goal) throw new AppError(404, "Goal was not found", "NOT_FOUND");
  response.status(204).send();
};
