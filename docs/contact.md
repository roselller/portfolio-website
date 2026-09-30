# Contact service

The contact form validates submissions on the client and in a Server Action. Genuine submissions require Neon PostgreSQL, Upstash Redis, and a private rate-limit salt. Without these settings, the form reports that it cannot accept messages.

## Setup

1. Configure `DATABASE_URL` with the pooled Neon connection URL and `DATABASE_URL_UNPOOLED` with the direct connection URL. Keep their TLS settings.
2. Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for the intended Redis database.
3. Generate a private value with `openssl rand -hex 32` and store it as `RATE_LIMIT_SALT`.
4. Review the committed migration and run `pnpm db:migrate` against the intended database.
5. Verify a controlled submission using a development or preview database.

The runtime uses Drizzle's Neon HTTP driver. The migration wrapper requires the direct database URL before invoking `drizzle-kit migrate`.

## Request handling

- Zod validates the name, email, and message on both sides of the request.
- A hidden honeypot filters basic automated submissions.
- The rate limiter permits five submissions per ten minutes per hashed client IP. Limiter failures and timeouts reject the submission rather than bypassing the limit.
- Vercel and Netlify use their platform-owned IP headers. Other hosts share a conservative fallback bucket until a trusted proxy is configured; arbitrary forwarded headers are not trusted.
- Successful submissions are stored in the `messages` table. Raw IP addresses are not stored in messages or Redis keys.

This application does not send notification emails or expose an administrative interface. Read and manage submissions through private database tooling, and apply a retention policy suitable for the deployment. Database contents and exports must stay outside the source repository.

## Database commands

| Command            | Purpose                                                                           |
| ------------------ | --------------------------------------------------------------------------------- |
| `pnpm db:generate` | Generate a migration after changing the schema; review its SQL before applying it |
| `pnpm db:migrate`  | Apply committed migrations using the direct connection URL                        |
| `pnpm db:studio`   | Open the database editor locally                                                  |
| `pnpm db:seed`     | Optionally populate the legacy projects table with sample concepts                |

The projects table is retained for compatibility with the existing schema. The homepage uses GitHub pins and local samples, so project seeding is not required. Do not run seeding automatically during deployment; use separate databases or branches for development, preview, and production.
