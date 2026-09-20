import { NutritionEntryModel } from "../models/nutrition-entry.model.js";
import { GoalModel } from "../models/goal.model.js";
import { NotificationModel } from "../models/notification.model.js";
import { ProgressEntryModel } from "../models/progress-entry.model.js";
import { WorkoutRoutineModel } from "../models/workout-routine.model.js";

const todayStart = (): Date => {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
};

export const getDashboard = async (userId: string) => {
  const today = todayStart();
  const [
    recentWorkouts,
    nutritionTotals,
    latestProgress,
    activeGoals,
    unreadNotifications,
  ] = await Promise.all([
    WorkoutRoutineModel.find({ userId }).sort({ completedAt: -1 }).limit(5),
    NutritionEntryModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: today } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          calories: { $sum: "$items.calories" },
          protein: { $sum: "$items.protein" },
          carbs: { $sum: "$items.carbs" },
          fat: { $sum: "$items.fat" },
        },
      },
    ]),
    ProgressEntryModel.findOne({ userId }).sort({ date: -1 }),
    GoalModel.find({ userId, achieved: false })
      .sort({ createdAt: -1 })
      .limit(5),
    NotificationModel.countDocuments({ userId, read: false }),
  ]);

  return {
    recentWorkouts,
    nutritionToday: nutritionTotals[0] ?? {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
    latestProgress,
    activeGoals,
    unreadNotifications,
  };
};
import { Types } from "mongoose";
