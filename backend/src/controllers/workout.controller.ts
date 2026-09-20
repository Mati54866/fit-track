import type { RequestHandler } from "express";
import { z } from "zod";

import { WorkoutRoutineModel } from "../models/workout-routine.model.js";
import { createNotification } from "../services/notification.service.js";
import { evaluateGoalsForUser } from "../services/goal.service.js";
import {
  findWorkoutForUser,
  listWorkouts,
} from "../services/workout.service.js";
import { objectIdSchema, paginationSchema } from "../utils/request.js";
import { AppError } from "../utils/app-error.js";

const exerciseSchema = z.object({
  name: z.string().trim().min(1).max(100),
  sets: z.number().nonnegative(),
  reps: z.number().nonnegative(),
  weight: z.number().nonnegative(),
  notes: z.string().trim().max(1_000).optional(),
});

const workoutSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.enum(["strength", "cardio", "other"]),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  exercises: z.array(exerciseSchema).max(100).default([]),
  completedAt: z.coerce.date(),
});

const listSchema = paginationSchema.extend({
  category: z.enum(["strength", "cardio", "other"]).optional(),
  tag: z.string().trim().min(1).max(40).optional(),
  search: z.string().trim().min(1).max(100).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const list: RequestHandler = async (request, response) => {
  const input = listSchema.parse(request.query);
  const { items, total } = await listWorkouts({
    userId: request.auth!.userId,
    ...input,
  });
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
  const input = workoutSchema.parse(request.body);
  const workout = await WorkoutRoutineModel.create({
    ...input,
    userId: request.auth!.userId,
    tags: input.tags.map((tag) => tag.toLowerCase()),
  });
  await createNotification({
    userId: request.auth!.userId,
    type: "workout_completion",
    message: `Workout completed: ${workout.name}`,
  });
  await evaluateGoalsForUser(request.auth!.userId);
  response.status(201).json({ data: { workout } });
};

export const getById: RequestHandler = async (request, response) => {
  const id = objectIdSchema.parse(request.params.id);
  const workout = await findWorkoutForUser(id, request.auth!.userId);
  if (!workout) throw new AppError(404, "Workout was not found", "NOT_FOUND");
  response.status(200).json({ data: { workout } });
};

export const update: RequestHandler = async (request, response) => {
  const id = objectIdSchema.parse(request.params.id);
  const input = workoutSchema.partial().parse(request.body);
  const updateData = input.tags
    ? { ...input, tags: input.tags.map((tag) => tag.toLowerCase()) }
    : input;
  const workout = await WorkoutRoutineModel.findOneAndUpdate(
    { _id: id, userId: request.auth!.userId },
    updateData,
    { new: true, runValidators: true },
  );
  if (!workout) throw new AppError(404, "Workout was not found", "NOT_FOUND");
  response.status(200).json({ data: { workout } });
};

export const remove: RequestHandler = async (request, response) => {
  const id = objectIdSchema.parse(request.params.id);
  const workout = await WorkoutRoutineModel.findOneAndDelete({
    _id: id,
    userId: request.auth!.userId,
  });
  if (!workout) throw new AppError(404, "Workout was not found", "NOT_FOUND");
  response.status(204).send();
};
