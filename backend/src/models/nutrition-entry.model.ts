import { InferSchemaType, Model, Schema, model } from "mongoose";

const nutritionItemSchema = new Schema(
  {
    foodName: { type: String, required: true, trim: true, maxlength: 120 },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true, maxlength: 20 },
    calories: { type: Number, required: true, min: 0 },
    protein: { type: Number, required: true, min: 0 },
    carbs: { type: Number, required: true, min: 0 },
    fat: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const nutritionEntrySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack"],
      required: true,
    },
    items: {
      type: [nutritionItemSchema],
      required: true,
      validate: [
        (items: unknown[]) => items.length > 0,
        "At least one food item is required",
      ],
    },
  },
  { timestamps: true, versionKey: false },
);

nutritionEntrySchema.index({ userId: 1, date: -1 });

export type NutritionEntry = InferSchemaType<typeof nutritionEntrySchema>;
export const NutritionEntryModel: Model<NutritionEntry> = model<NutritionEntry>(
  "NutritionEntry",
  nutritionEntrySchema,
);
