import { describe, expect, it } from "vitest";

import { getPagination, objectIdSchema } from "../src/utils/request.js";

describe("request helpers", () => {
  it("calculates pagination offsets", () => {
    expect(getPagination(3, 20)).toEqual({ skip: 40, limit: 20 });
  });

  it("accepts MongoDB ObjectIds and rejects malformed IDs", () => {
    expect(objectIdSchema.parse("507f1f77bcf86cd799439011")).toBe("507f1f77bcf86cd799439011");
    expect(() => objectIdSchema.parse("not-an-id")).toThrow();
  });
});
