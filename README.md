# Portfolio Website

The personal portfolio of **Roseller Armirola**, designer and developer. An interactive 3D signpost introduces selected work, with project details drawn from public GitHub repositories.

## Features

- **Interactive project navigation:** responsive 3D signs with pointer interaction, individual title fitting, and an alternative card view.
- **GitHub integration without a token:** pinned repositories appear in profile order, with server-side caching and hourly revalidation. Clearly labeled sample concepts fill remaining places up to six projects.
- **Repository briefs:** project pages display README content with readable tables, code blocks, images, and previous/next navigation.
- **Adaptive presentation:** dark and light themes, bundled fonts, a shader background, keyboard-accessible project links, reduced-motion support, and a WebGL fallback.
- **Optional contact storage:** validated submissions, honeypot protection, and Redis rate limiting, with messages stored in PostgreSQL.

## Stack

| Area                | Technology                                                        |
| ------------------- | ----------------------------------------------------------------- |
| Application         | Next.js 16.3.5 App Router, React 19.2, TypeScript                 |
| Graphics and motion | Three.js, React Three Fiber, Drei, GSAP, Framer Motion            |
| Styling             | Tailwind CSS 4, shared CSS tokens, locally bundled fonts          |
| Project data        | Public GitHub pages, `node-html-parser`, Next.js Data Cache       |
| Contact form        | React Hook Form, Zod, Neon PostgreSQL, Drizzle ORM, Upstash Redis |
| Tooling             | pnpm, ESLint, Prettier, Node.js test runner with `tsx`            |

## Getting started

Use **Node.js 22 or newer** and **pnpm 11.19.0**, as specified in `package.json`.

```sh
git clone https://github.com/roselller/portfolio-website.git
cd portfolio-website
pnpm install --frozen-lockfile
cp .env.local.example .env.local
pnpm dev
```

Open [localhost:3000](http://localhost:3000). The example configuration selects the public `roselller` GitHub profile. The portfolio runs without a GitHub token or database credentials; contact submissions remain unavailable until the optional services are configured.

## Configuration

Keep local settings in `.env.local` and configure production values through the hosting provider. Only the example environment file belongs in Git.

| Variable                    | Purpose                                                         | Required for          |
| --------------------------- | --------------------------------------------------------------- | --------------------- |
| `GITHUB_USERNAME`           | Public profile whose pinned repositories populate the portfolio | Live GitHub projects  |
| `NEXT_PUBLIC_SITE_URL`      | Site origin used for metadata; defaults to local development    | Production metadata   |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Optional publicly displayed contact address                     | Email link            |
| `NEXT_PUBLIC_IMAGE_HOSTS`   | Comma-separated trusted HTTPS hosts for project cover images    | Remote cover images   |
| `DATABASE_URL`              | Pooled Neon connection URL                                      | Contact storage       |
| `DATABASE_URL_UNPOOLED`     | Direct Neon connection URL                                      | Database migrations   |
| `UPSTASH_REDIS_REST_URL`    | Redis REST endpoint                                             | Contact rate limiting |
| `UPSTASH_REDIS_REST_TOKEN`  | Redis REST credential                                           | Contact rate limiting |
| `RATE_LIMIT_SALT`           | Private value used to hash rate-limit identifiers               | Contact rate limiting |

`NEXT_PUBLIC_` values are public and may be embedded in client assets at build time. Keep database credentials, Redis credentials, and the rate-limit salt in server-only variables.

### Project data

The server reads pinned repositories directly from public GitHub pages, avoiding a token requirement and an additional community API dependency. The collection and individual READMEs are cached for one hour. Changes become visible through request-driven revalidation after the cache expires.

One to five pins are padded with sample concepts to reach six projects. Missing configuration, zero pins, timeouts, or an unavailable profile produce a complete sample fallback. An unavailable README falls back to the project description and repository link. GitHub markup changes may require parser updates.

See [GitHub project data](docs/github-pinned-projects.md) for field mapping, parsing, and cache details.

### Contact form

Configure Neon and Upstash, generate a private salt with `openssl rand -hex 32`, then apply the committed database migration:

```sh
pnpm db:migrate
```

Successful submissions are stored in the `messages` table. Email delivery and an administrative interface are not included. See [contact setup](docs/contact.md) for operational details and database commands.

## Development

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm format:check
pnpm build
```

Use `pnpm format` to apply formatting and `pnpm start` to preview a production build. Tests cover GitHub parsing and fallbacks, README rendering, signpost geometry and pointer behavior, and contact validation and service failures.

```text
src/
  app/                  Routes, layouts, global styles, and Server Actions
  components/           Interface components and README rendering
    three/              Signpost scene, model parts, and interaction
  data/                 Profile, site copy, and sample projects
  db/                   Database client and schema
  lib/                  Project loaders, geometry, validation, and service logic
  styles/               Shared font declarations and design tokens
public/                 Bundled fonts, icons, and the signpost model
drizzle/                Database migrations and schema metadata
tests/                  Unit and regression tests
```

Edit `src/data/profile.ts` and `src/data/site-copy.ts` for identity and interface copy, `src/data/projects.ts` for sample concepts, and `src/styles/` for shared typography and colors. [Signpost architecture](docs/signpost.md) explains sizing and interaction boundaries.

## Deployment

Deploy with a server-capable Next.js host. The included `vercel.json` configures a frozen-lockfile installation and production build. Set the production environment variables, apply reviewed migrations to the intended database, and verify project pages and a controlled contact submission after deployment.

Static export, including plain GitHub Pages hosting, does not support this application's hourly revalidation or Server Actions. For self-hosting, run `pnpm build` followed by `pnpm start`; the start script binds to loopback, so configure the host binding and reverse proxy for your environment. `netlify.toml.example` is provided as an optional deployment template.

## Asset attribution

Monocraft and Miracode are bundled under the SIL Open Font License. Their original notices and license texts are preserved in [public/fonts](public/fonts/LICENSE-fonts.md).
