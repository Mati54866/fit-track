import { GoalModel } from "../models/goal.model.js";
import { NotificationModel } from "../models/notification.model.js";
import { NutritionEntryModel } from "../models/nutrition-entry.model.js";
import { ProgressEntryModel } from "../models/progress-entry.model.js";
import { RefreshSessionModel } from "../models/refresh-session.model.js";
import { ReminderModel } from "../models/reminder.model.js";
import { SupportTicketModel } from "../models/support-ticket.model.js";
import { UserModel } from "../models/user.model.js";
import { WorkoutRoutineModel } from "../models/workout-routine.model.js";
import { AppError } from "../utils/app-error.js";

export const exportUserData = async (userId: string) => {
  const [
    user,
    workouts,
    nutritionEntries,
    progressEntries,
    goals,
    reminders,
    notifications,
    supportTickets,
  ] = await Promise.all([
    UserModel.findById(userId),
    WorkoutRoutineModel.find({ userId }),
    NutritionEntryModel.find({ userId }),
    ProgressEntryModel.find({ userId }),
    GoalModel.find({ userId }),
    ReminderModel.find({ userId }),
    NotificationModel.find({ userId }),
    SupportTicketModel.find({ userId }),
  ]);
  if (!user) throw new AppError(404, "User account was not found", "NOT_FOUND");
  return {
    exportedAt: new Date().toISOString(),
    user,
    workouts,
    nutritionEntries,
    progressEntries,
    goals,
    reminders,
    notifications,
    supportTickets,
  };
};

export const deleteUserData = async (userId: string): Promise<void> => {
  await Promise.all([
    WorkoutRoutineModel.deleteMany({ userId }),
    NutritionEntryModel.deleteMany({ userId }),
    ProgressEntryModel.deleteMany({ userId }),
    GoalModel.deleteMany({ userId }),
    ReminderModel.deleteMany({ userId }),
    NotificationModel.deleteMany({ userId }),
    SupportTicketModel.deleteMany({ userId }),
    RefreshSessionModel.deleteMany({ userId }),
  ]);
  await UserModel.findByIdAndDelete(userId);
};
