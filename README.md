# Push-Up Challenge Tracker

A shareable web app for tracking a group push-up challenge: **100 push-ups a day
for a year**, with **$500 on the line for any week you fall short of 700**.

Everyone in the group signs in with a display name + PIN, logs push-ups
throughout the day (as many entries as they want), and can see their own
daily/weekly/monthly/annual stats as well as a group leaderboard showing
who's on pace and who currently owes money.

## Features

- **Multi-entry logging** — log push-ups in as many batches as you like per
  day (quick-add buttons for 10/20/25/50, or a custom amount), for today or
  any past day you forgot to log.
- **Daily / weekly / monthly / annual stats** — progress bars against the
  100/day goal, weekly totals against the 700/week goal, monthly rollups,
  and whole-challenge pace, streaks, and completion %.
- **Stakes tracking** — every completed week under 700 push-ups is flagged
  as missed, and the app totals up how much ($500 per missed week, by
  default) each person currently owes.
- **Group leaderboard** — see everyone's today/this-week progress, streaks,
  total push-ups, and amount owed, sortable by a few different metrics.
- **Simple name + PIN accounts** — no email verification, just a display
  name and a 4-6 digit PIN, good enough for a private group of friends.

All day/week boundaries are computed in UTC so every participant shares the
same day and week cutoffs regardless of timezone.

## Tech stack

- [Next.js 14](https://nextjs.org/) (App Router) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io/) + PostgreSQL
- Session cookies signed with [jose](https://github.com/panva/jose),
  PINs hashed with bcrypt

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start a local Postgres (skip this if you already have one, or point
   `DATABASE_URL` at a free Neon/Supabase database instead):

   ```bash
   docker compose up -d
   ```

3. Copy the env template and fill in a Postgres connection string and a
   random session secret:

   ```bash
   cp .env.example .env
   # DATABASE_URL=postgresql://user:password@localhost:5432/pushup_dev
   # SESSION_SECRET=$(openssl rand -base64 32)
   # CHALLENGE_START_DATE=2026-01-01   (the day your challenge begins)
   ```

4. Run migrations and seed the challenge configuration (defaults to
   today's date if you skip `CHALLENGE_START_DATE`):

   ```bash
   npx prisma migrate dev
   npx tsx prisma/seed.ts
   ```

5. Start the dev server:

   ```bash
   npm run dev
   ```

6. Visit `http://localhost:3000`, create an account (any name + a 4-6
   digit PIN), and start logging push-ups.

To test it as a group of friends on one machine: open a second browser
(or an incognito window) and sign up with a different name — each
name+PIN is a separate account, and they all show up together on
`/group`.

To let friends on your phone/other devices hit your local dev server
before deploying anywhere, run `npm run dev -- -H 0.0.0.0` and share
`http://<your-machine's-LAN-IP>:3000` while everyone's on the same
network — this is just for a quick local test, not a permanent link (use
the Vercel deploy below for that).

## Deploying (Vercel + hosted Postgres)

1. **Create a Postgres database.** [Neon](https://neon.tech) or
   [Supabase](https://supabase.com) both have free tiers that work well.
   Copy the connection string they give you (Neon: use the "pooled"
   connection string).

2. **Push this repo to GitHub** (already done if you're reading this from
   the repo) and import it into [Vercel](https://vercel.com/new).

3. **Set environment variables** in the Vercel project settings:
   - `DATABASE_URL` — the Postgres connection string from step 1
   - `SESSION_SECRET` — output of `openssl rand -base64 32`
   - `CHALLENGE_START_DATE` — the date your challenge starts, `YYYY-MM-DD`

4. **Run migrations against the production database** once, from your
   machine (or a one-off Vercel deploy hook):

   ```bash
   DATABASE_URL="<your prod url>" npx prisma migrate deploy
   DATABASE_URL="<your prod url>" CHALLENGE_START_DATE="2026-01-01" npx tsx prisma/seed.ts
   ```

5. Deploy. Share the resulting URL with your friends — everyone who signs
   up joins the same shared challenge and shows up on the group
   leaderboard.

### Changing challenge settings later

The challenge configuration (daily goal, weekly goal, stake amount,
duration, start date) lives in the single `Challenge` row in the database.
To change it after the fact, update that row directly, e.g. via
`npx prisma studio` pointed at your production `DATABASE_URL`.

## Notes on known dependency advisories

`next@14.2.35` and its bundled `postcss` still carry a couple of open,
non-critical advisories (denial-of-service edge cases in Server
Actions/Server Functions, and a PostCSS sourcemap-parsing issue). This app
doesn't use Server Actions and doesn't process untrusted CSS, so they don't
apply to how it's built here, but keep an eye out for a Next.js 14.2.x
patch release (or plan a Next 15/16 migration) over time.
