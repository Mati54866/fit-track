import { defineConfig } from "@playwright/test";

const testEnvironment = {
  NODE_ENV: "test",
  PORT: "5001",
  MONGO_URI: "mongodb://localhost:27017/fittrack-e2e",
  CLIENT_ORIGIN: "http://localhost:5173",
  JWT_ACCESS_SECRET: "test-access-secret-must-be-at-least-32-characters",
  JWT_ACCESS_TTL: "15m",
  JWT_REFRESH_SECRET: "test-refresh-secret-must-be-at-least-32-characters",
  JWT_REFRESH_TTL: "30d",
  COOKIE_SAME_SITE: "lax",
  COOKIE_SECURE: "false",
  CLIENT_ID: "test-google-client-id",
  CLIENT_SECRET: "test-google-client-secret",
  GOOGLE_CALLBACK_URL: "http://localhost:5001/api/v1/auth/google/callback",
  CLOUD_NAME: "test-cloud",
  CLOUD_API_KEY: "test-key",
  CLOUD_API_SECRET: "test-secret",
};

export default defineConfig({
  testDir: "../e2e",
  fullyParallel: true,
  use: { baseURL: "http://127.0.0.1:5001" },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:5001/health",
    reuseExistingServer: false,
    env: testEnvironment,
  },
});
