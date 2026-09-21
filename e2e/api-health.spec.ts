import { expect, test } from "@playwright/test";

test("API health endpoint is available", async ({ request }) => {
  const response = await request.get("/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});

test("unknown API paths return the structured error response", async ({
  request,
}) => {
  const response = await request.get("/not-a-route");
  expect(response.status()).toBe(404);
  expect(await response.json()).toEqual({
    error: {
      code: "NOT_FOUND",
      message: "Route GET /not-a-route was not found",
    },
  });
});
