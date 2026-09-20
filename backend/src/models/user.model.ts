import {
  HydratedDocument,
  InferSchemaType,
  Model,
  Schema,
  model,
} from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_]+$/,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    passwordHash: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true, select: false },
    avatarUrl: { type: String, default: "" },
    unitsPreference: {
      type: String,
      enum: ["metric", "imperial"],
      default: "metric",
    },
    themePreference: { type: String, enum: ["dark", "light"], default: "dark" },
    profileCompleted: { type: Boolean, default: false },
    consent: {
      privacyPolicy: { type: Boolean, default: false },
      acceptedAt: { type: Date },
      policyVersion: { type: String, default: "v1" },
    },
    notificationPreferences: {
      inApp: { type: Boolean, default: true },
    },
  },
  { timestamps: true, versionKey: false },
);

export type User = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<User>;
export const UserModel: Model<User> = model<User>("User", userSchema);
