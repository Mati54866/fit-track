import type { RequestHandler } from "express";
import { Types } from "mongoose";
import { z } from "zod";

import { NutritionEntryModel } from "../models/nutrition-entry.model.js";
import { ProgressEntryModel } from "../models/progress-entry.model.js";
import { WorkoutRoutineModel } from "../models/workout-routine.model.js";

const rangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

const getRange = (query: unknown) => {
  const input = rangeSchema.parse(query);
  const to = input.to ?? new Date();
  const from = input.from ?? new Date(to.getTime() - 30 * 24 * 60 * 60 * 1_000);
  return { from, to };
};

export const workouts: RequestHandler = async (request, response) => {
  const { from, to } = getRange(request.query);
  const userId = new Types.ObjectId(request.auth!.userId);
  const match = { userId, completedAt: { $gte: from, $lte: to } };
  const [summary, frequency, exerciseHistory] = await Promise.all([
    WorkoutRoutineModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          workouts: { $sum: 1 },
          exerciseCount: { $sum: { $size: "$exercises" } },
        },
      },
    ]),
    WorkoutRoutineModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", count: 1 } },
    ]),
    WorkoutRoutineModel.aggregate([
      { $match: match },
      { $unwind: "$exercises" },
      {
        $group: {
          _id: "$exercises.name",
          sessions: { $sum: 1 },
          maxWeight: { $max: "$exercises.weight" },
          totalVolume: {
            $sum: {
              $multiply: [
                "$exercises.sets",
                "$exercises.reps",
                "$exercises.weight",
              ],
            },
          },
        },
      },
      { $sort: { totalVolume: -1 } },
      { $limit: 20 },
      {
        $project: {
          _id: 0,
          exercise: "$_id",
          sessions: 1,
          maxWeight: 1,
          totalVolume: 1,
        },
      },
    ]),
  ]);
  response
    .status(200)
    .json({
      data: {
        range: { from, to },
        summary: summary[0] ?? { workouts: 0, exerciseCount: 0 },
        frequency,
        exerciseHistory,
      },
    });
};

export const nutrition: RequestHandler = async (request, response) => {
  const { from, to } = getRange(request.query);
  const userId = new Types.ObjectId(request.auth!.userId);
  const match = { userId, date: { $gte: from, $lte: to } };
  const [daily, byMeal] = await Promise.all([
    NutritionEntryModel.aggregate([
      { $match: match },
      { $unwind: "$items" },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          calories: { $sum: "$items.calories" },
          protein: { $sum: "$items.protein" },
          carbs: { $sum: "$items.carbs" },
          fat: { $sum: "$items.fat" },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id",
          calories: 1,
          protein: 1,
          carbs: 1,
          fat: 1,
        },
      },
    ]),
    NutritionEntryModel.aggregate([
      { $match: match },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$mealType",
          calories: { $sum: "$items.calories" },
          protein: { $sum: "$items.protein" },
          carbs: { $sum: "$items.carbs" },
          fat: { $sum: "$items.fat" },
        },
      },
      {
        $project: {
          _id: 0,
          mealType: "$_id",
          calories: 1,
          protein: 1,
          carbs: 1,
          fat: 1,
        },
      },
    ]),
  ]);
  response.status(200).json({ data: { range: { from, to }, daily, byMeal } });
};

export const progress: RequestHandler = async (request, response) => {
  const { from, to } = getRange(request.query);
  const items = await ProgressEntryModel.find({
    userId: request.auth!.userId,
    date: { $gte: from, $lte: to },
  }).sort({ date: 1 });
  response.status(200).json({ data: { range: { from, to }, items } });
};
