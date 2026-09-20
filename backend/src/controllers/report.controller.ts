import type { RequestHandler } from "express";
import PDFDocument from "pdfkit";
import { z } from "zod";

import { NutritionEntryModel } from "../models/nutrition-entry.model.js";
import { ProgressEntryModel } from "../models/progress-entry.model.js";

const querySchema = z.object({
  type: z.enum(["nutrition", "progress"]),
  format: z.enum(["csv", "pdf"]),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

const csvEscape = (value: unknown): string =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;

const getReportRows = async (
  userId: string,
  type: "nutrition" | "progress",
  from?: Date,
  to?: Date,
) => {
  const date =
    from || to
      ? { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) }
      : undefined;
  if (type === "nutrition") {
    const entries = await NutritionEntryModel.find({
      userId,
      ...(date ? { date } : {}),
    }).sort({ date: 1 });
    return {
      title: "Nutrition report",
      headers: [
        "Date",
        "Meal",
        "Food",
        "Quantity",
        "Unit",
        "Calories",
        "Protein",
        "Carbs",
        "Fat",
      ],
      rows: entries.flatMap((entry) =>
        entry.items.map((item) => [
          entry.date.toISOString().slice(0, 10),
          entry.mealType,
          item.foodName,
          item.quantity,
          item.unit,
          item.calories,
          item.protein,
          item.carbs,
          item.fat,
        ]),
      ),
    };
  }
  const entries = await ProgressEntryModel.find({
    userId,
    ...(date ? { date } : {}),
  }).sort({ date: 1 });
  return {
    title: "Progress report",
    headers: ["Date", "Weight", "Measurements", "Performance metrics"],
    rows: entries.map((entry) => [
      entry.date.toISOString().slice(0, 10),
      entry.weight ?? "",
      JSON.stringify(entry.measurements ?? {}),
      JSON.stringify(entry.performanceMetrics ?? []),
    ]),
  };
};

export const exportReport: RequestHandler = async (request, response) => {
  const { type, format, from, to } = querySchema.parse(request.query);
  const report = await getReportRows(request.auth!.userId, type, from, to);
  const filename = `fittrack-${type}-report.${format}`;

  if (format === "csv") {
    response
      .attachment(filename)
      .type("text/csv")
      .status(200)
      .send(
        [report.headers, ...report.rows]
          .map((row) => row.map(csvEscape).join(","))
          .join("\n"),
      );
    return;
  }

  response.attachment(filename).type("application/pdf");
  const document = new PDFDocument({ margin: 42, size: "A4" });
  document.pipe(response);
  document.fontSize(20).text(report.title);
  document
    .moveDown()
    .fontSize(9)
    .fillColor("#555555")
    .text(`Generated ${new Date().toLocaleString()}`);
  document.moveDown().fillColor("#000000").fontSize(8);
  document.text(report.headers.join(" | "));
  document.moveDown(0.4);
  report.rows.forEach((row) => {
    if (document.y > 760) document.addPage();
    document.text(row.map(String).join(" | "));
  });
  document.end();
};
