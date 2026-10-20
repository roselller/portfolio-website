# Configuration

Keep local settings in `.env.local` and configure production values through the hosting provider. Only the example environment file (`.env.local.example`) belongs in Git.

| Variable                    | Purpose                                                                                                                      | Required for           |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `GITHUB_USERNAME`           | Public profile whose pinned repositories populate the portfolio                                                              | Live GitHub projects   |
| `NEXT_PUBLIC_SITE_URL`      | Site origin for metadata and the sitemap; falls back to Vercel's production domain, then localhost. Leave it unset on Vercel | Custom domains only    |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Optional publicly displayed contact address (the deployment guide recommends leaving it unset)                               | Email link             |
| `NEXT_PUBLIC_IMAGE_HOSTS`   | Comma-separated trusted HTTPS hosts for project cover images                                                                 | Remote cover images    |
| `DATABASE_URL`              | Pooled Neon connection URL of the insert-only `portfolio_app` user (the only database URL for the host)                      | Contact storage        |
| `DATABASE_URL_UNPOOLED`     | Direct Neon connection URL of the database owner. Keep it on your own computer; never add it to the host                     | Database migrations    |
| `UPSTASH_REDIS_REST_URL`    | Redis REST endpoint                                                                                                          | Contact rate limiting  |
| `UPSTASH_REDIS_REST_TOKEN`  | Redis REST credential                                                                                                        | Contact rate limiting  |
| `RATE_LIMIT_SALT`           | Private value used to hash rate-limit identifiers                                                                            | Contact rate limiting  |
| `RESEND_API_KEY`            | Resend API key for message notifications                                                                                     | Contact form           |
| `CONTACT_TO_EMAIL`          | Address that receives new messages                                                                                           | Contact form           |
| `CONTACT_FROM_EMAIL`        | Sender; defaults to `Portfolio <onboarding@resend.dev>`                                                                      | Verified Resend domain |

`NEXT_PUBLIC_` values are public and may be embedded in client assets at build time. Keep database credentials, Redis credentials, the rate-limit salt, and the Resend API key in server-only variables.

The [deployment runbook](deployment.md) says which of these belong on the host and how to store them safely.

The portfolio runs without a GitHub token or database credentials. Without the contact settings, the contact form reports that it cannot accept messages. See [GitHub project data](github-pinned-projects.md) for how the pinned repositories are read, cached, and replaced by samples, and [Contact service](contact.md) for the contact form setup (the page is prerendered, so rebuild after changing its settings).
