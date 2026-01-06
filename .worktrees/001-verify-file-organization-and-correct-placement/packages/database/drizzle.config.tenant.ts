import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/tenant/schema.ts",
  out: "./drizzle/migrations/tenant",
  dbCredentials: {
    url: process.env.DATABASE_URL_TENANT || "postgresql://postgres:password@localhost:5432/tenant_1",
  },
  verbose: true,
  strict: true,
});
