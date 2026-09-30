import { config } from "dotenv";
import { spawnSync } from "node:child_process";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });
if (!process.env.DATABASE_URL_UNPOOLED) {
  console.error(
    "Set DATABASE_URL_UNPOOLED to your direct Neon connection string before migrating.",
  );
  process.exit(1);
}
const result = spawnSync("pnpm", ["exec", "drizzle-kit", "migrate"], {
  stdio: "inherit",
  env: process.env,
});
process.exit(result.status ?? 1);
