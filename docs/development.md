# Development

## Technology

| Area                | Technology                                                                |
| ------------------- | ------------------------------------------------------------------------- |
| Application         | Next.js (App Router), React, TypeScript                                   |
| Graphics and motion | Three.js, React Three Fiber, Drei, GSAP, Framer Motion                    |
| Styling             | Tailwind CSS, shared CSS tokens, locally bundled fonts                    |
| Project data        | Public GitHub pages, `node-html-parser`, Next.js Data Cache               |
| Contact form        | React Hook Form, Zod, Neon PostgreSQL, Drizzle ORM, Upstash Redis, Resend |
| Tooling             | pnpm, ESLint, Prettier, Node.js test runner with `tsx`                    |

The home page also runs an animated [shader background](https://github.com/ruucm/shadergradient) from ruucm (about 30 fps; other pages use a static CSS gradient). Search and sharing come from a sitemap that includes the pinned projects, `robots.txt`, and Open Graph metadata.

## Checks

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm format:check
pnpm build
```

Use `pnpm format` to apply formatting and `pnpm start` to preview a production build. Tests cover GitHub parsing and fallbacks, README rendering, signpost geometry, pointer behavior and sign text, and contact validation, notifications, and service failures.

## Project layout

```text
src/
  app/                  Routes, layouts, global styles, and Server Actions
  components/           Interface components and README rendering
    three/              Signpost scene, model parts, and interaction
  data/                 Profile, site copy, skills, journey, and sample projects
  db/                   Database client and schema
  lib/                  Project loaders, geometry, validation, and service logic
  styles/               Shared font declarations and design tokens
public/                 Bundled fonts, icons, and the signpost model
drizzle/                Database migrations and schema metadata
tests/                  Unit and regression tests
```

Edit `src/data/profile.ts` and `src/data/site-copy.ts` for identity and interface copy, `src/data/skills.ts` and `src/data/journey.ts` for the About page, `src/data/projects.ts` for sample concepts, and `src/styles/` for shared typography and colors. [Signpost architecture](signpost.md) explains sizing and interaction boundaries.

## Security headers

`next.config.ts` sends a Content Security Policy and standard hardening headers on every route (HSTS in production only). The policy uses no nonces, because the pages are static or ISR. A few entries need care:

- `blob:` in `script-src` and `worker-src` lets the 3D text library (troika) start its worker.
- `img-src` allows any `https:` host, because README images redirect through several GitHub CDN hosts.
- `connect-src 'self'` blocks troika's fallback-font download from a CDN. If a sign title used a character missing from the sign font, the whole 3D scene would stay blank, so `toSignText()` replaces such characters with `?`. The sign fonts are subsets; see [public/fonts](../public/fonts/LICENSE-fonts.md) before changing them.

Check the browser console for CSP violations after adding any third-party script, font, or API call.

The other headers are `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, a strict `Referrer-Policy`, `Cross-Origin-Opener-Policy: same-origin` (pages from other origins cannot keep a handle on this one), and a `Permissions-Policy` that switches off the camera, microphone, location, payment and USB.

## Installing packages

`pnpm-workspace.yaml` sets `minimumReleaseAge: 1440`, so `pnpm add` and `pnpm update` skip any package version published in the last 24 hours (most hijacked releases are pulled within hours). Installs from the lockfile are not affected. If you need a brand-new release, wait a day or name the package in `minimumReleaseAgeExclude`.
