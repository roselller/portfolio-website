# Portfolio Website

The personal portfolio of **Roseller Armirola**, designer and developer. An interactive 3D signpost introduces selected work, with project details drawn from public GitHub repositories.

## Features

- **Interactive project navigation:** responsive 3D signs with pointer interaction, individual title fitting, and an alternative card view.
- **GitHub integration without a token:** pinned repositories appear in profile order, with server-side caching and hourly revalidation. Clearly labeled sample concepts fill remaining places up to six projects.
- **Repository briefs:** project pages display README content with readable tables, code blocks, images, and previous/next navigation.
- **Adaptive presentation:** dark and light themes, bundled fonts, an animated shader background on the home page (about 30 fps; other pages use a static CSS gradient), keyboard-accessible project links, reduced-motion support, and a WebGL fallback.
- **Optional contact form:** validated submissions, honeypot protection, and Redis rate limiting. Messages are stored in PostgreSQL, then emailed to the owner through Resend.
- **Security and search:** a Content Security Policy with standard hardening headers, a sitemap that includes the pinned projects, `robots.txt`, and Open Graph metadata.

## Stack

| Area                | Technology                                                                |
| ------------------- | ------------------------------------------------------------------------- |
| Application         | Next.js 16.3.8 App Router, React 19.2, TypeScript                         |
| Graphics and motion | Three.js, React Three Fiber, Drei, GSAP, Framer Motion                    |
| Styling             | Tailwind CSS 4, shared CSS tokens, locally bundled fonts                  |
| Project data        | Public GitHub pages, `node-html-parser`, Next.js Data Cache               |
| Contact form        | React Hook Form, Zod, Neon PostgreSQL, Drizzle ORM, Upstash Redis, Resend |
| Tooling             | pnpm, ESLint, Prettier, Node.js test runner with `tsx`                    |

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

| Variable                    | Purpose                                                                                            | Required for           |
| --------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------- |
| `GITHUB_USERNAME`           | Public profile whose pinned repositories populate the portfolio                                    | Live GitHub projects   |
| `NEXT_PUBLIC_SITE_URL`      | Site origin for metadata and the sitemap; falls back to Vercel's production domain, then localhost | Production metadata    |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Optional publicly displayed contact address                                                        | Email link             |
| `NEXT_PUBLIC_IMAGE_HOSTS`   | Comma-separated trusted HTTPS hosts for project cover images                                       | Remote cover images    |
| `DATABASE_URL`              | Pooled Neon connection URL                                                                         | Contact storage        |
| `DATABASE_URL_UNPOOLED`     | Direct Neon connection URL                                                                         | Database migrations    |
| `UPSTASH_REDIS_REST_URL`    | Redis REST endpoint                                                                                | Contact rate limiting  |
| `UPSTASH_REDIS_REST_TOKEN`  | Redis REST credential                                                                              | Contact rate limiting  |
| `RATE_LIMIT_SALT`           | Private value used to hash rate-limit identifiers                                                  | Contact rate limiting  |
| `RESEND_API_KEY`            | Resend API key for message notifications                                                           | Contact form           |
| `CONTACT_TO_EMAIL`          | Address that receives new messages                                                                 | Contact form           |
| `CONTACT_FROM_EMAIL`        | Sender; defaults to `Portfolio <onboarding@resend.dev>`                                            | Verified Resend domain |

`NEXT_PUBLIC_` values are public and may be embedded in client assets at build time. Keep database credentials, Redis credentials, the rate-limit salt, and the Resend API key in server-only variables.

### Project data

The server reads pinned repositories directly from public GitHub pages, avoiding a token requirement and an additional community API dependency. The collection and individual READMEs are cached for one hour. Changes become visible through request-driven revalidation after the cache expires.

One to five pins are padded with sample concepts to reach six projects. Missing configuration, zero pins, timeouts, or an unavailable profile produce a complete sample fallback. An unavailable README falls back to the project description and repository link. GitHub markup changes may require parser updates.

See [GitHub project data](docs/github-pinned-projects.md) for field mapping, parsing, and cache details.

### Contact form

Configure Neon, Upstash, and Resend, generate a private salt with `openssl rand -hex 32`, then apply the committed database migration:

```sh
pnpm db:migrate
```

Successful submissions are stored in the `messages` table, then Resend emails a copy to `CONTACT_TO_EMAIL`. If the email fails, the message is still saved and the visitor still sees success. There is no administrative interface. `pnpm db:prune` deletes old messages (a dry run unless you pass `--confirm`). The contact page is prerendered, so it checks the contact settings at build time: rebuild after changing them. See [contact setup](docs/contact.md) for operational details and database commands.

## Development

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm format:check
pnpm build
```

Use `pnpm format` to apply formatting and `pnpm start` to preview a production build. Tests cover GitHub parsing and fallbacks, README rendering, signpost geometry, pointer behavior and sign text, and contact validation, notifications, and service failures.

### Security headers

`next.config.ts` sends a Content Security Policy and standard hardening headers on every route (HSTS in production only). The policy uses no nonces, because the pages are static or ISR. A few entries need care:

- `blob:` in `script-src` and `worker-src` lets the 3D text library (troika) start its worker.
- `img-src` allows any `https:` host, because README images redirect through several GitHub CDN hosts.
- `connect-src 'self'` blocks troika's fallback-font download from a CDN. If a sign title used a character missing from the sign font, the whole 3D scene would stay blank, so `toSignText()` replaces such characters with `?`. The sign fonts are subsets; see [public/fonts](public/fonts/LICENSE-fonts.md) before changing them.

Check the browser console for CSP violations after adding any third-party script, font, or API call.

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

Deploy with a server-capable Next.js host. The included `vercel.json` configures a frozen-lockfile installation and production build. Set the production environment variables (including `NEXT_PUBLIC_SITE_URL`, so the sitemap and share links use your domain), apply reviewed migrations to the intended database, and verify project pages and a controlled contact submission after deployment.

Static export, including plain GitHub Pages hosting, does not support this application's hourly revalidation or Server Actions. For self-hosting, run `pnpm build` followed by `pnpm start`; the start script binds to loopback, so configure the host binding and reverse proxy for your environment. `netlify.toml.example` is provided as an optional deployment template.

## Asset attribution

Monocraft and Miracode are bundled under the SIL Open Font License. Their original notices and license texts are preserved in [public/fonts](public/fonts/LICENSE-fonts.md).
