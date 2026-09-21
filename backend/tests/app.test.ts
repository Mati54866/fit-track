import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../src/app.js";

describe("application health", () => {
  it("responds to the health endpoint without database work", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("returns the standard not-found response", async () => {
    const response = await request(app).get("/missing");
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });
});
