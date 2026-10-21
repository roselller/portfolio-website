# Portfolio Website

Welcome to my portfolio, in a website! See it live at **[roseller.vercel.app](https://roseller.vercel.app)**.

Instead of a plain list, my projects hang on a 3D signpost. Pick a sign to read about the project behind it.

## What you'll find

- **A 3D signpost.** Move your cursor to tilt it, or switch to a simple card view.
- **Projects that stay up to date.** My pinned GitHub repositories show up automatically, each with its README. No login or token needed.
- **An About page** with my skills and my journey so far.
- **A contact form** that blocks spam, saves each message securely, and emails it to me.
- **Comfortable everywhere.** Light and dark themes, phone to desktop layouts, keyboard support, and reduced-motion support.

## Built with

Next.js, React, and TypeScript, with Three.js for the 3D scene and Tailwind CSS for styling. The contact form uses Neon (database), Upstash (spam limits), and Resend (email).

## Run it on your computer

You'll need [Node.js](https://nodejs.org) 22 or newer and [pnpm](https://pnpm.io) 11.19.0 (the version pinned in `package.json`).

```sh
git clone https://github.com/roselller/portfolio-website.git
cd portfolio-website
pnpm install --frozen-lockfile
cp .env.local.example .env.local
pnpm dev
```

Then open [localhost:3000](http://localhost:3000). It shows my GitHub projects by default. To show yours, set `GITHUB_USERNAME` in `.env.local` to your GitHub username.

You don't need any accounts or keys to look around. Until you set up the contact form (see the [contact guide](docs/contact.md)), it shows a notice that it isn't accepting messages yet.

## Make it yours

- `src/data/profile.ts` and `src/data/site-copy.ts`: your name, links, and most of the words on the site.
- `src/data/skills.ts`, `src/data/journey.ts`, and `public/logos/`: the skills and journey on the About page, and the logos beside them.
- `src/app/(marketing)/about/page.tsx` and `src/app/(marketing)/contact/page.tsx`: the biography, the quote, and the contact page text.
- `src/data/projects.ts`: sample projects shown when you have fewer than six pins.
- `src/styles/`: fonts and colors.

## Put it online

I host it on Vercel. The [deployment guide](docs/deployment.md) has the full step-by-step, including how to keep your keys safe. Set `GITHUB_USERNAME` on the host to your own GitHub username (the guide's example uses mine). Once Vercel is connected to the repository, every push to `main` goes live.

The site needs a host that can run a Next.js server, so plain GitHub Pages won't work; the end of the guide covers other hosts.

## For developers

Run the checks before publishing a change:

```sh
pnpm typecheck && pnpm lint && pnpm test && pnpm format:check && pnpm build
```

More detail lives in `docs/`: [development guide](docs/development.md) (project layout and security headers), [GitHub project data](docs/github-pinned-projects.md), [signpost architecture](docs/signpost.md), [contact service](docs/contact.md), and [configuration](docs/configuration.md).

## Credits and license

The home page's [animated shader background](https://github.com/ruucm/shadergradient) is from ruucm. Google Sans and Fraunces are bundled under the SIL Open Font License; the notices are in [public/fonts](public/fonts/LICENSE-fonts.md). The code is released under the [MIT License](LICENSE).
