import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/tenant/schema.ts",
  out: "./drizzle/migrations/tenant",
  dbCredentials: {
    // This will be used as a template - actual tenant DB URLs set at runtime
    url: process.env.TENANT_DATABASE_URL || "postgresql://localhost:5432/tenant_1",
  },
  verbose: true,
  strict: true,
});
