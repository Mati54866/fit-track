import type { RequestHandler } from "express";
import { z } from "zod";

import { SupportTicketModel } from "../models/support-ticket.model.js";
import { paginationSchema } from "../utils/request.js";

const ticketSchema = z.object({
  category: z.enum(["support", "bug", "feedback"]),
  subject: z.string().trim().min(1).max(160),
  message: z.string().trim().min(1).max(5_000),
});

export const list: RequestHandler = async (request, response) => {
  const { page, limit } = paginationSchema.parse(request.query);
  const [items, total] = await Promise.all([
    SupportTicketModel.find({ userId: request.auth!.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    SupportTicketModel.countDocuments({ userId: request.auth!.userId }),
  ]);
  response
    .status(200)
    .json({ data: { items, pagination: { page, limit, total } } });
};

export const create: RequestHandler = async (request, response) => {
  const ticket = await SupportTicketModel.create({
    ...ticketSchema.parse(request.body),
    userId: request.auth!.userId,
  });
  response.status(201).json({ data: { ticket } });
};
