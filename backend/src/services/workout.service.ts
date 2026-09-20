import { FilterQuery } from "mongoose";

import {
  WorkoutRoutineModel,
  type WorkoutRoutine,
} from "../models/workout-routine.model.js";

export const listWorkouts = async ({
  userId,
  page,
  limit,
  category,
  tag,
  search,
  from,
  to,
}: {
  userId: string;
  page: number;
  limit: number;
  category?: string;
  tag?: string;
  search?: string;
  from?: Date;
  to?: Date;
}) => {
  const filter: FilterQuery<WorkoutRoutine> = { userId };
  if (category) filter.category = category;
  if (tag) filter.tags = tag.toLowerCase();
  if (search) filter.name = { $regex: search, $options: "i" };
  if (from || to)
    filter.completedAt = {
      ...(from ? { $gte: from } : {}),
      ...(to ? { $lte: to } : {}),
    };

  const [items, total] = await Promise.all([
    WorkoutRoutineModel.find(filter)
      .sort({ completedAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    WorkoutRoutineModel.countDocuments(filter),
  ]);
  return { items, total };
};

export const findWorkoutForUser = (id: string, userId: string) =>
  WorkoutRoutineModel.findOne({ _id: id, userId });
