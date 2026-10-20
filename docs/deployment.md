# Deployment runbook (Vercel, Neon, Upstash, Resend)

This is the checklist for putting the site live and keeping it healthy. Every service below has a free plan that is
enough for a portfolio. Create all of them in **Singapore** (`ap-southeast-1`, Vercel region `sin1`) so the contact form
does not cross an ocean three times per message. `vercel.json` already sets `"regions": ["sin1"]`.

**Once Vercel is connected to this GitHub repository, every push to `main` deploys to production.** Pushes to other
branches and pull requests create preview deployments instead. Merge to `main` only when you want the change live.

## Security rules for secrets

- Never paste a credential into a chat, an issue, a commit, or a screenshot.
- Generate passwords and salts in your own terminal with `openssl rand -hex 32`.
- Turn on two-factor authentication for GitHub, Vercel, Neon, Upstash, and Resend.
- Only `.env.local.example` is tracked in Git. `.env.local` stays on your machine.
- Give every secret the **Secret** type on Vercel (older Vercel screens called this "Sensitive"; the value is then write-only and can never be read back from the dashboard) and give it to
  **Production only**. Preview deployments then run without any secrets: their contact form correctly says it is not
  accepting messages.

## Two database users

| User                         | Used by                         | Can do                                    | Where its URL lives                           |
| ---------------------------- | ------------------------------- | ----------------------------------------- | --------------------------------------------- |
| `portfolio_app` (you create) | The live website                | Insert rows into `messages`, nothing else | Vercel Production, as `DATABASE_URL`          |
| Neon owner (`neondb_owner`)  | You, for migrations and cleanup | Everything                                | `.env.local` only, as `DATABASE_URL_UNPOOLED` |

If the website's database URL ever leaks, an attacker can add junk messages but cannot read, change, or delete the
stored ones. Never put the owner URL on Vercel.

## 1. Neon (database)

1. Sign up at neon.com and create a project named `portfolio` in **AWS Singapore (ap-southeast-1)**.
   Create it on neon.com itself, not through Vercel's integration marketplace, because the integration copies owner-level
   URLs into Vercel.
2. In **Connect**, turn **Connection pooling off** and copy the connection string (the host has no `-pooler`). Put it in
   `.env.local` as `DATABASE_URL_UNPOOLED`.
3. Apply the migrations from your computer: `pnpm db:migrate`. This creates the `messages` table (0000), then removes the
   old unused `projects` table (0001).
4. In the Neon **SQL Editor**, create the website's user. Use a password from `openssl rand -hex 32` (Neon needs at least
   60 bits of entropy, and hex needs no URL escaping):

   ```sql
   CREATE ROLE portfolio_app WITH LOGIN PASSWORD '<paste the password>';
   GRANT USAGE ON SCHEMA public TO portfolio_app;
   GRANT INSERT ON TABLE public.messages TO portfolio_app;
   ```

   The website's insert uses database defaults and no `RETURNING`, so `INSERT` is all it needs. Roles created with SQL are
   not members of `neon_superuser`, so they get nothing else. **Run the `GRANT INSERT` line again after any future
   migration that recreates the `messages` table.**

5. Build the website's URL: take the **pooled** connection string (turn pooling on; the host contains `-pooler`) and
   replace the user and password with `portfolio_app` and its password. This is Vercel's `DATABASE_URL`.

## 2. Upstash (rate limiting)

Create a Redis database with the primary region **Singapore (ap-southeast-1)**. From its REST API section copy
`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (the normal token, not the read-only one).

Limits in force (see `src/lib/rate-limit.ts`): 5 messages per 10 minutes per visitor, and 30 messages per UTC day for the
whole site. The daily cap keeps spam from many addresses away from Resend's free allowance of 100 emails a day and from
filling the database. The trade-off: a determined sender can close the form until the next UTC day (the GitHub and
LinkedIn buttons on the Contact page keep working).

## 3. Resend (email)

1. Sign up with the address that should receive messages.
2. Create an API key with **Sending access** only.
3. Until you verify your own domain, set `CONTACT_TO_EMAIL` to that signup address and leave `CONTACT_FROM_EMAIL` unset.
   Mail then comes from `onboarding@resend.dev`. The free plan only delivers to the signup address.

## 4. Vercel (hosting)

1. Sign in to vercel.com with GitHub and import `roselller/portfolio-website`. Framework: Next.js (detected).
2. On the import screen add **only** the two non-secret variables, so nothing sensitive can land in Preview or
   Development by accident (the import screen may not offer a per-environment scope or the Secret type):
   `GITHUB_USERNAME` = your own GitHub username (this site uses `roselller`) and `ENABLE_EXPERIMENTAL_COREPACK` = `1` (makes Vercel use the pinned `pnpm@11.19.0`;
   see "pnpm on Vercel" below). Deploy. This first deployment is harmless: the contact form says it is not accepting
   messages.
3. Once the build is healthy, open **Settings, Environment Variables** and add the secrets one at a time. For each one tick
   **Production only** and choose the **Secret** type (not Config):

   | Variable                                             | Notes                                                                          |
   | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
   | `DATABASE_URL`                                       | The `portfolio_app` pooled URL.                                                |
   | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | From Upstash.                                                                  |
   | `RATE_LIMIT_SALT`                                    | `openssl rand -hex 32`. Never change it casually (it resets everyone's limit). |
   | `RESEND_API_KEY`, `CONTACT_TO_EMAIL`                 | From Resend.                                                                   |

   Do **not** add `DATABASE_URL_UNPOOLED` (owner access), `NEXT_PUBLIC_SITE_URL` (the site falls back to the production
   domain Vercel provides; the `localhost` value from the example file would break the sitemap and share links),
   `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` (Vercel handles it), or `NEXT_PUBLIC_CONTACT_EMAIL` (a public address invites spam;
   the form is enough). Then **Redeploy**.

4. In **Settings**, leave **Automatically expose System Environment Variables** on (the site URL fallback needs it),
   keep **Git Fork Protection** on (the default; this repository is public, and without it a stranger's pull request
   could build with your variables), and keep **Deployment Protection** on for previews.
5. Environment variable changes only take effect on a new deployment, and the contact page is prerendered, so always
   **Redeploy** after changing one.

### pnpm on Vercel

Vercel's documentation lists pnpm 6 to 10, while this repository pins `pnpm@11.19.0` (`packageManager` in
`package.json`, `allowBuilds` in `pnpm-workspace.yaml`). `ENABLE_EXPERIMENTAL_COREPACK=1` asks Vercel to honor the pinned
version. Node is not a problem: `engines.node: ">=22"` resolves to the latest 24.x on Vercel, which still ships Corepack
(Node 25 and later do not). If Vercel later moves `>=22` to a Node version without Corepack and the build breaks, use the
`npx` fallback below.

**First thing to check on the first build:** the install step in the build log should say `pnpm 11.19.0`. If the build
fails with `packages field missing or empty` or an `ERR_PNPM_*` message, an older pnpm was used. A failed build never goes
live, so it is safe to try the fallback, which runs pnpm 11 through `npx` for both steps (older pnpm also reads
`pnpm-workspace.yaml` when running scripts):

```json
{
  "installCommand": "npx --yes pnpm@11.19.0 install --frozen-lockfile",
  "buildCommand": "npx --yes pnpm@11.19.0 build"
}
```

## 5. Checks after the first deployment

Replace `SITE` with the `vercel.app` address Vercel gave you.

1. **Build log:** pnpm 11.19.0, Node 24, function region Singapore (`sin1`).
2. **Headers:** `curl -sI https://SITE/` shows `content-security-policy`, `strict-transport-security`,
   `x-frame-options: DENY`, `x-content-type-options: nosniff`, and no `x-powered-by`.
3. **CSP in a real browser:** open the home page, About, Contact, and one project page with the developer console open.
   There must be no "Refused to ..." messages, the 3D signpost must show, and the signs must be your real GitHub pins
   rather than the sample projects.
4. **Metadata:** `https://SITE/sitemap.xml` and `https://SITE/robots.txt` use the `vercel.app` address, not `localhost`.
5. **Contact form:** send a test message. "Message received" appears, the email arrives, and the row shows in Neon's
   **Tables** view.
6. **Separate limits per visitor:** send one test message from your phone on mobile data and one from a computer on Wi-Fi.
   In Upstash's data browser, search for `portfolio:contact:`. Each key looks like `portfolio:contact:<long hash>:<window>`.
   Compare the **hash** between the two colons: the phone's and the computer's must differ. (The `<window>` part changes
   by itself over time, so only the hash counts.) If the hash is the same, the real visitor address is not being read and
   everyone would share a single 5-per-10-minutes allowance. A separate `portfolio:sitecap:` key holds the daily total.
7. **Database user is locked down.** In the Neon SQL Editor:

   ```sql
   SELECT has_table_privilege('portfolio_app', 'public.messages', 'INSERT') AS can_insert,  -- true
          has_table_privilege('portfolio_app', 'public.messages', 'SELECT') AS can_read,    -- false
          has_table_privilege('portfolio_app', 'public.messages', 'DELETE') AS can_delete,  -- false
          pg_has_role('portfolio_app', 'pg_read_all_data', 'USAGE')         AS reads_all;   -- false
   ```

8. **Previews stay secret-free:** a preview deployment's Contact page says it is not accepting messages.
9. **Secrets are write-only:** in Vercel's Environment Variables list, each of the six secrets shows only a **Production**
   label, and setting the type filter to **Config** lists none of them.

## Day-to-day

- **Roll back a bad release:** Vercel dashboard, Deployments, pick the last good one, **Instant Rollback**.
- **Delete old messages** (personal data should not be kept forever). From your computer, with the owner URL in
  `.env.local`: `pnpm db:prune` shows how many are older than 365 days, then `pnpm db:prune --confirm` deletes them.
  Pruning is manual on purpose: automating it would mean storing owner credentials in another service.
- **Backups:** the emailed copies are a second record. Neon's free plan keeps only a short restore window.
- **Spam flood:** in the Vercel dashboard, Firewall, turn on **Attack Challenge Mode** while it lasts.
- **Rotate a leaked secret:** change it at the provider first, update the Vercel variable, then **Redeploy**. For the
  database user: `ALTER ROLE portfolio_app WITH PASSWORD '<new password>';`, then update `DATABASE_URL`.
- **Custom domain later:** add it in Vercel (Settings, Domains). No code change is needed. The site sends
  `Strict-Transport-Security` with `includeSubDomains`, so every subdomain of your domain must then serve HTTPS. Verify
  the domain in Resend to send mail from your own address.

## Other hosts

Deploy with a server-capable Next.js host. Static export, including plain GitHub Pages hosting, does not support this application's hourly revalidation or Server Actions. For self-hosting, run `pnpm build` followed by `pnpm start`; the start script binds to loopback, so configure the host binding and reverse proxy for your environment. `netlify.toml.example` is provided as an optional deployment template.
