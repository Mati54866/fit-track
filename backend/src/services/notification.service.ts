import { NotificationModel } from "../models/notification.model.js";

export const createNotification = async ({
  userId,
  type,
  message,
}: {
  userId: string;
  type: "workout_completion" | "goal_achievement" | "reminder";
  message: string;
}): Promise<void> => {
  await NotificationModel.create({ userId, type, message });
};
