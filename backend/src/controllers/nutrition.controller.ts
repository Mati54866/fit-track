import type { RequestHandler } from "express";
import { z } from "zod";

import { NutritionEntryModel } from "../models/nutrition-entry.model.js";
import { listNutritionEntries } from "../services/nutrition.service.js";
import { evaluateGoalsForUser } from "../services/goal.service.js";
import { AppError } from "../utils/app-error.js";
import { objectIdSchema, paginationSchema } from "../utils/request.js";

const itemSchema = z.object({
  foodName: z.string().trim().min(1).max(120),
  quantity: z.number().nonnegative(),
  unit: z.string().trim().min(1).max(20),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
});

const nutritionSchema = z.object({
  date: z.coerce.date(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  items: z.array(itemSchema).min(1).max(100),
});

const listSchema = paginationSchema.extend({
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  search: z.string().trim().min(1).max(100).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const list: RequestHandler = async (request, response) => {
  const input = listSchema.parse(request.query);
  const { items, total } = await listNutritionEntries({
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
  const input = nutritionSchema.parse(request.body);
  const entry = await NutritionEntryModel.create({
    ...input,
    userId: request.auth!.userId,
  });
  await evaluateGoalsForUser(request.auth!.userId);
  response.status(201).json({ data: { entry } });
};

export const getById: RequestHandler = async (request, response) => {
  const id = objectIdSchema.parse(request.params.id);
  const entry = await NutritionEntryModel.findOne({
    _id: id,
    userId: request.auth!.userId,
  });
  if (!entry)
    throw new AppError(404, "Nutrition entry was not found", "NOT_FOUND");
  response.status(200).json({ data: { entry } });
};

export const update: RequestHandler = async (request, response) => {
  const id = objectIdSchema.parse(request.params.id);
  const input = nutritionSchema.partial().parse(request.body);
  const entry = await NutritionEntryModel.findOneAndUpdate(
    { _id: id, userId: request.auth!.userId },
    input,
    { new: true, runValidators: true },
  );
  if (!entry)
    throw new AppError(404, "Nutrition entry was not found", "NOT_FOUND");
  response.status(200).json({ data: { entry } });
};

export const remove: RequestHandler = async (request, response) => {
  const id = objectIdSchema.parse(request.params.id);
  const entry = await NutritionEntryModel.findOneAndDelete({
    _id: id,
    userId: request.auth!.userId,
  });
  if (!entry)
    throw new AppError(404, "Nutrition entry was not found", "NOT_FOUND");
  response.status(204).send();
};
