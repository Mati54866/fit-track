import type { RequestHandler } from "express";
import { z } from "zod";

import { deleteUserData, exportUserData } from "../services/account.service.js";
import { clearSessionCookies } from "../utils/cookies.js";

export const exportData: RequestHandler = async (request, response) => {
  const data = await exportUserData(request.auth!.userId);
  response.attachment("fittrack-personal-data.json").status(200).json(data);
};

export const removeAccount: RequestHandler = async (request, response) => {
  z.object({ confirmation: z.literal("DELETE") }).parse(request.body);
  await deleteUserData(request.auth!.userId);
  clearSessionCookies(response);
  response.status(204).send();
};
