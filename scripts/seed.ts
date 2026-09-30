import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { projects } from "../src/db/schema";
import { sampleProjects } from "../src/data/projects";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

async function seed() {
  if (!process.env.DATABASE_URL)
    throw new Error("Set DATABASE_URL in .env.local before seeding.");
  const database = drizzle(neon(process.env.DATABASE_URL));
  const inserted = await database
    .insert(projects)
    .values(sampleProjects.map((project) => ({ ...project, id: undefined })))
    .onConflictDoNothing({ target: projects.slug })
    .returning({ slug: projects.slug });
  console.log(
    `Inserted ${inserted.length} sample projects. Existing project content was preserved.`,
  );
}

seed().catch(() => {
  console.error(
    "Seeding failed. Verify your connection and run pnpm db:migrate first.",
  );
  process.exitCode = 1;
});
