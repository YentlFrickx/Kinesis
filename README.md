# Kinesis

A small offline-capable web app (PWA) for planning and following bodyweight strength, stretching and mobility sessions. Built with injury prevention for runners in mind, useful for anyone.

- **Library:** 78 exercises (strength, stretches, mobility) with a looping stick-figure animation and instructions.
- **Planner:** build named sessions; per exercise set seconds or reps, sets and rest after it; defaults for rest between sets and exercises. Reorder, duplicate, delete, export/import as a JSON backup (sessions, favourites and history; importing merges history without duplicating entries).
- **Player:** guided run with countdown, rep "Done" button, auto left/right with a switch-sides step, rest steps with next-up preview, beeps and voice cues (mute toggle), vibration and screen wake-lock.
  - **Timer:** timestamp-based, so a locked/throttled/backgrounded tab catches up on return (carrying through every step that elapsed, cues for the final step only). Optional **auto reps** toggle (in the player's sound settings sheet, off by default) paces rep steps at 3 s/rep with a spoken count; "Skip" acts as the manual override.
  - **Platform limits:** browsers suspend timers, speech and vibration when the screen is off, and iOS Safari additionally suspends audio for web pages in the background. Cues cannot reliably play with the screen locked; the session state is exact when you return, but beeps/voice for steps that passed while locked are not replayed.
- **Starter sessions:** a 30-minute strength workout aimed at runners and a short feet & calves stretch are added on first launch (restorable from the Sessions screen).
- Data stays in your browser (localStorage). No backend, works offline once loaded.

## Develop

```bash
npm install
npm run dev        # app on http://localhost:5173, animation review sheet at /contact.html
npm test           # unit tests (stores, player engine, progress, data)
npm run build
```

## Adding an exercise

Add an entry to `src/data/exercises.ts`. The animation is a list of keyframe poses (joint coordinates in a 200×140 box, floor at y=126) drawn by the shared skeleton in `src/animation/`. Check it on `/contact.html`.

## Testing

- `npm test` runs the Vitest unit tests (stores, player engine, progress, data integrity); `npm run test:coverage` adds a coverage report (also run in CI).
- `npm run e2e` runs the Playwright suite (smoke flow, service-worker/offline check, axe accessibility scan) on desktop and mobile Chromium projects. By default it builds the app and serves it with `vite preview`; first run `npx playwright install chromium`. Set `BASE_URL` to test a deployment instead, e.g. `BASE_URL=https://pr-12.kinesis.pages.dev npm run e2e`.
- In CI, `preview.yml` waits for the Cloudflare Pages preview and runs the suite against it with `BASE_URL`; a failure fails the PR check, and the HTML report and traces are uploaded as the `playwright-report-preview` artifact. PRs from forks (no secrets, no preview) run the same suite against a local `vite preview` instead. `deploy.yml` smoke-tests production after deploying when the repository variable `PRODUCTION_URL` is set.
- The axe scan (`e2e/a11y.spec.ts`) fails on any serious or critical WCAG A/AA violation; no rules are exempted.

## Deploy

Production and PR previews both run on one [Cloudflare Pages](https://pages.cloudflare.com/) project, deployed by GitHub Actions: pushing to `main` runs `.github/workflows/deploy.yml` (lint, test, build, deploy to the production branch); each pull request from a branch in this repo gets its own preview via `.github/workflows/preview.yml` (`https://pr-<number>.<project>.pages.dev`, posted as a PR comment). Previews have a separate origin from production, so they never touch real localStorage data. PRs from forks are skipped because they cannot access the secrets. When a PR is closed, `.github/workflows/preview-cleanup.yml` deletes its preview deployments and GitHub deployment environment.

One-time setup:

1. Create the Pages project with direct upload (no Git connection): `npx wrangler pages project create kinesis --production-branch=main`.
2. Create an API token (My Profile → API Tokens) with **Account → Cloudflare Pages → Edit**, and note your Account ID.
3. In the GitHub repo → Settings → Secrets and variables → Actions, add the secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. If the project is not named `kinesis`, add a repository variable `CLOUDFLARE_PAGES_PROJECT`.
4. Custom domain: Cloudflare dashboard → Workers & Pages → the project → Custom domains → Set up a domain. Because the domain is on Cloudflare, the DNS record is created for you.

The app is served from the domain root, so `BASE_PATH` is no longer set in CI. Data lives in each browser's localStorage per origin: anyone moving from the old GitHub Pages URL should use Export there and Import on the new domain.
