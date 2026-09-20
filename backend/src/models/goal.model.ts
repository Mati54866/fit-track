import { InferSchemaType, Model, Schema, model } from "mongoose";

const goalSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["workout_count", "calories", "protein", "carbs", "fat", "weight"],
      required: true,
    },
    targetValue: { type: Number, required: true, min: 0 },
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly", "one_time"],
      required: true,
    },
    deadline: { type: Date },
    weightDirection: {
      type: String,
      enum: ["lose", "gain"],
      required: function () {
        return this.type === "weight";
      },
    },
    achieved: { type: Boolean, default: false },
    achievedAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

goalSchema.index({ userId: 1, achieved: 1 });

export type Goal = InferSchemaType<typeof goalSchema>;
export const GoalModel: Model<Goal> = model<Goal>("Goal", goalSchema);
