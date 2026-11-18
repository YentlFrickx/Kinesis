# Kinesis

A small offline-capable web app (PWA) for planning and following bodyweight strength, stretching and mobility sessions. Built with injury prevention for runners in mind, useful for anyone.

- **Library:** 55 exercises (strength, stretches, mobility) with a looping stick-figure animation and instructions.
- **Planner:** build named sessions; per exercise set seconds or reps, sets and rest after it; defaults for rest between sets and exercises. Reorder, duplicate, delete, export/import as JSON.
- **Player:** guided run with countdown, rep "Done" button, auto left/right with a switch-sides step, rest steps with next-up preview, beeps and voice cues (mute toggle), vibration and screen wake-lock.
- **Starter sessions:** a 30-minute strength workout aimed at runners and a short feet & calves stretch are added on first launch (restorable from the Sessions screen).
- Data stays in your browser (localStorage). No backend, works offline once loaded.

## Develop

```bash
npm install
npm run dev        # app on http://localhost:5173, animation review sheet at /contact.html
npm test           # player engine tests
npm run build
```

## Adding an exercise

Add an entry to `src/data/exercises.ts`. The animation is a list of keyframe poses (joint coordinates in a 200×140 box, floor at y=126) drawn by the shared skeleton in `src/animation/`. Check it on `/contact.html`.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml` (lint, test, build, GitHub Pages). In the repo settings, set **Pages → Source** to **GitHub Actions** once.

## PR previews

Every pull request from a branch in this repo is built and deployed to its own [Cloudflare Pages](https://pages.cloudflare.com/) preview (`https://pr-<number>.<project>.pages.dev`) by `.github/workflows/preview.yml`; the URL is posted as a comment on the PR. Previews have a separate origin from production, so they never touch real localStorage data. Production still deploys from `main` to GitHub Pages.

One-time setup:

1. In Cloudflare, create a Pages project with direct upload (no Git connection): `npx wrangler pages project create kinesis-preview --production-branch=main` (or Dashboard → Workers & Pages → Create → Pages → Upload assets).
2. Create an API token (My Profile → API Tokens) with **Account → Cloudflare Pages → Edit**, and note your Account ID.
3. In the GitHub repo → Settings → Secrets and variables → Actions, add the secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. If you named the project something other than `kinesis-preview`, add a repository variable `CLOUDFLARE_PAGES_PROJECT`.

Previews are not deleted automatically when a PR closes; remove old ones in the Cloudflare dashboard if you care. PRs from forks are skipped because they cannot access the secrets.
