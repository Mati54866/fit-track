import { describe, expect, it } from "vitest";

import { parseDurationToMilliseconds } from "../src/utils/cookies.js";

describe("parseDurationToMilliseconds", () => {
  it.each([
    ["15m", 900_000],
    ["8h", 28_800_000],
    ["30d", 2_592_000_000],
  ])("converts %s", (duration, expected) => {
    expect(parseDurationToMilliseconds(duration)).toBe(expected);
  });

  it("rejects unsafe or unsupported duration formats", () => {
    expect(() => parseDurationToMilliseconds("1w")).toThrow();
    expect(() => parseDurationToMilliseconds("0.5h")).toThrow();
  });
});
