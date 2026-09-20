import { FilterQuery } from "mongoose";

import {
  NutritionEntryModel,
  type NutritionEntry,
} from "../models/nutrition-entry.model.js";

export const listNutritionEntries = async ({
  userId,
  page,
  limit,
  mealType,
  search,
  from,
  to,
}: {
  userId: string;
  page: number;
  limit: number;
  mealType?: string;
  search?: string;
  from?: Date;
  to?: Date;
}) => {
  const filter: FilterQuery<NutritionEntry> = { userId };
  if (mealType) filter.mealType = mealType;
  if (search) filter["items.foodName"] = { $regex: search, $options: "i" };
  if (from || to)
    filter.date = {
      ...(from ? { $gte: from } : {}),
      ...(to ? { $lte: to } : {}),
    };

  const [items, total] = await Promise.all([
    NutritionEntryModel.find(filter)
      .sort({ date: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    NutritionEntryModel.countDocuments(filter),
  ]);
  return { items, total };
};
