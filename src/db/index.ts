import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDatabase(url: string) {
  return drizzle(neon(url), { schema });
}
let database: ReturnType<typeof createDatabase> | undefined;

export function getDatabase() {
  if (!process.env.DATABASE_URL) return null;
  database ??= createDatabase(process.env.DATABASE_URL);
  return database;
}
