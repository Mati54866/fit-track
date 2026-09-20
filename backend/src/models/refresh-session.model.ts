import { InferSchemaType, Model, Schema, model } from "mongoose";

const refreshSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionId: { type: String, required: true, unique: true, index: true },
    tokenHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    revokedAt: { type: Date },
    userAgent: { type: String, maxlength: 500 },
    ipAddress: { type: String, maxlength: 64 },
  },
  { timestamps: true, versionKey: false },
);

refreshSessionSchema.index({ userId: 1, revokedAt: 1 });

export type RefreshSession = InferSchemaType<typeof refreshSessionSchema>;
export const RefreshSessionModel: Model<RefreshSession> = model<RefreshSession>(
  "RefreshSession",
  refreshSessionSchema,
);
