# Portfolio development

This repository is the canonical portfolio project. Other local copies are
historical references; do not synchronize changes back to them.

- Use the existing Next.js App Router, strict TypeScript, and pnpm lockfile.
- Keep GitHub fetching and service credentials on the server.
- Preserve signpost positioning, rotation, fonts, and theme unless the task
  explicitly calls for a design change.
- Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm format:check`, and
  `pnpm build` before publishing changes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
