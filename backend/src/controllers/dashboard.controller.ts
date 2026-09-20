import type { RequestHandler } from "express";

import { getDashboard } from "../services/dashboard.service.js";

export const get: RequestHandler = async (request, response) => {
  response.status(200).json({ data: await getDashboard(request.auth!.userId) });
};
