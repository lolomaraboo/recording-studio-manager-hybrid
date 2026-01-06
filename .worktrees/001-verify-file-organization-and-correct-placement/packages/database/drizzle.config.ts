import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: [
    "./src/master/schema.ts",
    "./src/tenant/schema.ts"
  ],
  out: "./drizzle/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://localhost:5432/rsm_master",
  },
  verbose: true,
  strict: true,
});
