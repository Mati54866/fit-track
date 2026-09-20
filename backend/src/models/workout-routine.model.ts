import { InferSchemaType, Model, Schema, model } from "mongoose";

const exerciseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    sets: { type: Number, required: true, min: 0 },
    reps: { type: Number, required: true, min: 0 },
    weight: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true, maxlength: 1_000 },
  },
  { _id: false },
);

const workoutRoutineSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    category: {
      type: String,
      enum: ["strength", "cardio", "other"],
      required: true,
    },
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 40 }],
    exercises: { type: [exerciseSchema], default: [] },
    completedAt: { type: Date, required: true, index: true },
  },
  { timestamps: true, versionKey: false },
);

workoutRoutineSchema.index({ userId: 1, completedAt: -1 });
workoutRoutineSchema.index({ userId: 1, name: 1 });

export type WorkoutRoutine = InferSchemaType<typeof workoutRoutineSchema>;
export const WorkoutRoutineModel: Model<WorkoutRoutine> = model<WorkoutRoutine>(
  "WorkoutRoutine",
  workoutRoutineSchema,
);
