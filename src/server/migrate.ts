import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { getDbHandle } from "./db";
import * as schema from "@/db/schema";

/**
 * Quizkaiser keeps its own record of applied migrations. Drizzle's default record lives in
 * the shared "drizzle" schema; in a database that also holds Tippetuppen it would show
 * these migrations as already applied and the tippkaiser schema would never be created.
 */
const MIGRATIONS = { migrationsSchema: "tippkaiser_drizzle", migrationsTable: "__drizzle_migrations" } as const;

export async function runMigrations(migrationsFolder = "drizzle") {
  const handle = await getDbHandle();
  if (handle.kind === "pglite") {
    await migratePglite(handle.db as PgliteDatabase<typeof schema>, { migrationsFolder, ...MIGRATIONS });
  } else {
    await migratePostgres(handle.db as PostgresJsDatabase<typeof schema>, { migrationsFolder, ...MIGRATIONS });
  }
}
