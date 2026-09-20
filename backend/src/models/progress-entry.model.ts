import { InferSchemaType, Model, Schema, model } from "mongoose";

const performanceMetricSchema = new Schema(
  {
    metricName: { type: String, required: true, trim: true, maxlength: 100 },
    value: { type: Number, required: true },
    unit: { type: String, required: true, trim: true, maxlength: 20 },
  },
  { _id: false },
);

const progressEntrySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    weight: { type: Number, min: 0 },
    measurements: {
      type: Map,
      of: { type: Number, min: 0 },
      default: undefined,
    },
    performanceMetrics: { type: [performanceMetricSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

progressEntrySchema.index({ userId: 1, date: -1 });

export type ProgressEntry = InferSchemaType<typeof progressEntrySchema>;
export const ProgressEntryModel: Model<ProgressEntry> = model<ProgressEntry>(
  "ProgressEntry",
  progressEntrySchema,
);
