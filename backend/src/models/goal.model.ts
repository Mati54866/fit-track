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
      enum: ["workout_count", "calorie_target", "macro_target", "target_weight"],
      required: true,
    },
    targetValue: { type: Number, required: true, min: 0 },
    targetUnit: { type: String, trim: true, maxlength: 40 },
    deadline: { type: Date },
    achieved: { type: Boolean, default: false },
    achievedAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

goalSchema.index({ userId: 1, achieved: 1 });

export type Goal = InferSchemaType<typeof goalSchema>;
export const GoalModel: Model<Goal> = model<Goal>("Goal", goalSchema);
