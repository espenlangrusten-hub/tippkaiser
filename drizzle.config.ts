import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["tippkaiser"],
  migrations: { schema: "tippkaiser_drizzle", table: "__drizzle_migrations" },
  dbCredentials: { url: process.env.DATABASE_URL ?? "postgres://localhost/unused" },
});
