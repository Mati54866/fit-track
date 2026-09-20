import { ReminderModel } from "../models/reminder.model.js";
import { createNotification } from "./notification.service.js";

const nextDueDate = (
  date: Date,
  repeat: "none" | "daily" | "weekly" | "monthly",
): Date | null => {
  if (repeat === "none") return null;
  const next = new Date(date);
  if (repeat === "daily") next.setUTCDate(next.getUTCDate() + 1);
  if (repeat === "weekly") next.setUTCDate(next.getUTCDate() + 7);
  if (repeat === "monthly") next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
};

export const triggerDueReminders = async (userId: string): Promise<void> => {
  const reminders = await ReminderModel.find({
    userId,
    enabled: true,
    dueAt: { $lte: new Date() },
  });
  for (const reminder of reminders) {
    await createNotification({
      userId,
      type: "reminder",
      message: reminder.title,
    });
    reminder.lastTriggeredAt = new Date();
    const nextDue = nextDueDate(reminder.dueAt, reminder.repeat);
    if (nextDue) reminder.dueAt = nextDue;
    else reminder.enabled = false;
    await reminder.save();
  }
};
