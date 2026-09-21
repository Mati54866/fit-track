import { GoalModel } from "../models/goal.model.js";
import { NutritionEntryModel } from "../models/nutrition-entry.model.js";
import { ProgressEntryModel } from "../models/progress-entry.model.js";
import { WorkoutRoutineModel } from "../models/workout-routine.model.js";
import { createNotification } from "./notification.service.js";

export const evaluateGoalsForUser = async (userId: string): Promise<void> => {
  const goals = await GoalModel.find({ userId, achieved: false });

  for (const goal of goals) {
    let achieved = false;
    const dateFilter = goal.deadline ? { $lte: goal.deadline } : {};

    if (goal.type === "workout_count") {
      achieved =
        (await WorkoutRoutineModel.countDocuments({
          userId,
          completedAt: dateFilter,
        })) >= goal.targetValue;
    } else if (goal.type === "calorie_target" || goal.type === "macro_target") {
      const nutritionField = goal.type === "calorie_target" ? "calories" : goal.targetUnit;
      const totals = await NutritionEntryModel.aggregate<{ total: number }>([
        { $match: { userId: goal.userId, ...(goal.deadline ? { date: dateFilter } : {}) } },
        { $unwind: "$items" },
        { $group: { _id: null, total: { $sum: `$items.${nutritionField}` } } },
      ]);
      achieved = (totals[0]?.total ?? 0) >= goal.targetValue;
    } else if (goal.type === "target_weight") {
      const latest = await ProgressEntryModel.findOne({
        userId,
        weight: { $exists: true },
      }).sort({ date: -1 });
      achieved = Math.abs((latest?.weight ?? Infinity) - goal.targetValue) < 0.01;
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
