import { GoalModel } from "../models/goal.model.js";
import { NutritionEntryModel } from "../models/nutrition-entry.model.js";
import { ProgressEntryModel } from "../models/progress-entry.model.js";
import { WorkoutRoutineModel } from "../models/workout-routine.model.js";
import { createNotification } from "./notification.service.js";

const periodStart = (
  period: "daily" | "weekly" | "monthly" | "one_time",
): Date => {
  const now = new Date();
  if (period === "one_time") return new Date(0);
  if (period === "daily")
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
  if (period === "weekly") {
    const day = now.getUTCDay() || 7;
    return new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - day + 1,
      ),
    );
  }
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
};

export const evaluateGoalsForUser = async (userId: string): Promise<void> => {
  const goals = await GoalModel.find({ userId, achieved: false });

  for (const goal of goals) {
    let achieved = false;
    const from = periodStart(goal.period);

    if (goal.type === "workout_count") {
      achieved =
        (await WorkoutRoutineModel.countDocuments({
          userId,
          completedAt: { $gte: from },
        })) >= goal.targetValue;
    } else if (["calories", "protein", "carbs", "fat"].includes(goal.type)) {
      const totals = await NutritionEntryModel.aggregate<{ total: number }>([
        { $match: { userId: goal.userId, date: { $gte: from } } },
        { $unwind: "$items" },
        { $group: { _id: null, total: { $sum: `$items.${goal.type}` } } },
      ]);
      achieved = (totals[0]?.total ?? 0) >= goal.targetValue;
    } else if (goal.type === "weight") {
      const latest = await ProgressEntryModel.findOne({
        userId,
        weight: { $exists: true },
      }).sort({ date: -1 });
      achieved =
        goal.weightDirection === "lose"
          ? (latest?.weight ?? Infinity) <= goal.targetValue
          : (latest?.weight ?? -Infinity) >= goal.targetValue;
    }

    if (achieved) {
      goal.achieved = true;
      goal.achievedAt = new Date();
      await goal.save();
      await createNotification({
        userId,
        type: "goal_achievement",
        message: "Goal achieved — great work!",
      });
    }
  }
};
