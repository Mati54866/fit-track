import { InferSchemaType, Model, Schema, model } from "mongoose";

const reminderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    linkedGoalId: { type: Schema.Types.ObjectId, ref: "Goal" },
    dueAt: { type: Date, required: true, index: true },
    repeatRule: {
      type: String,
      enum: ["none", "daily", "weekly", "monthly"],
      default: "none",
    },
    enabled: { type: Boolean, default: true },
    lastTriggeredAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

reminderSchema.index({ userId: 1, enabled: 1, dueAt: 1 });

export type Reminder = InferSchemaType<typeof reminderSchema>;
export const ReminderModel: Model<Reminder> = model<Reminder>(
  "Reminder",
  reminderSchema,
);
