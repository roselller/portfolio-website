// Deletes old contact messages so personal data isn't kept forever.
//   pnpm db:prune                       -> shows how many would go (older than 365 days)
//   pnpm db:prune --days 180            -> same, with a different cut-off
//   pnpm db:prune --days 180 --confirm  -> actually deletes them
// Imports the schema directly: "@/db" is server-only and cannot run under tsx.
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { count, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { messages } from "../src/db/schema";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const MIN_DAYS = 30;

function readDays(args: string[]) {
  const index = args.indexOf("--days");
  if (index === -1) return 365;
  const days = Number(args[index + 1]);
  if (!Number.isInteger(days) || days < MIN_DAYS)
    throw new Error(`--days must be a whole number of at least ${MIN_DAYS}.`);
  return days;
}

async function prune() {
  const args = process.argv.slice(2);
  const days = readDays(args);
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) throw new Error("Set DATABASE_URL_UNPOOLED or DATABASE_URL first.");

  const database = drizzle(neon(url));
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const old = lt(messages.createdAt, cutoff);

  if (!args.includes("--confirm")) {
    const [{ total }] = await database
      .select({ total: count() })
      .from(messages)
      .where(old);
    console.log(
      `${total} message(s) are older than ${days} days. Re-run with --confirm to delete them.`,
    );
    return;
  }
  const deleted = await database
    .delete(messages)
    .where(old)
    .returning({ id: messages.id });
  console.log(`Deleted ${deleted.length} message(s) older than ${days} days.`);
}

prune().catch((error: unknown) => {
  // Never print the connection string or driver internals.
  console.error(
    error instanceof Error &&
      (error.message.startsWith("--days") || error.message.startsWith("Set "))
      ? error.message
      : "Pruning failed. Check your database URL and that pnpm db:migrate has run.",
  );
  process.exitCode = 1;
});
