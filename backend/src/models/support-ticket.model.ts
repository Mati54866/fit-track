import { InferSchemaType, Model, Schema, model } from "mongoose";

const supportTicketSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["bug", "feature_request", "account", "other"],
      required: true,
    },
    subject: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 5_000 },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open",
    },
  },
  { timestamps: true, versionKey: false },
);

supportTicketSchema.index({ userId: 1, createdAt: -1 });

export type SupportTicket = InferSchemaType<typeof supportTicketSchema>;
export const SupportTicketModel: Model<SupportTicket> = model<SupportTicket>(
  "SupportTicket",
  supportTicketSchema,
);
