# HomeRanking — Product & Design Spec

**Version:** 0.1 (draft for review)
**Owners:** Alix & David
**Status:** Spec under review — no implementation yet

---

## 1. The problem

Household labour is distributed unevenly in most couples, and the imbalance is
hard to discuss because it's hard to *see*. Two reasons:

1. **The invisible layer.** Most of the load isn't the doing — it's the
   noticing, planning, remembering and coordinating. "We're out of dish soap,
   add it to the list, remember to buy it" never gets counted, so whoever
   carries it looks like they're doing less than they are.
2. **No shared reference.** Both partners genuinely believe they do more,
   because each experiences their own effort fully and their partner's
   partially.

HomeRanking makes the total load visible, scores the invisible part explicitly,
and gives both people the same live picture.

## 2. What this is — and what it must never become

**It is** a shared, live, cooperative scoreboard that makes household load
visible and rebalanceable, and that is genuinely enjoyable to open.

**It must never become** a ledger of debt. A permanent running total of who
owes whom is corrosive to a relationship. Three structural decisions protect
against this, and they are non-negotiable requirements, not preferences:

- **The ledger resets weekly.** No debt can accumulate past 7 days.
- **The win condition is balance, not victory.** Neither person can "win" by
  out-scoring the other. The week is won when the beam is level *and* the
  chores are done.
- **Streaks are shared.** One household streak that both people feed. There is
  no individual streak to lose, and therefore nothing to blame each other for.

> **Design principle:** the opponent is the housework, not your partner.

## 3. Core loop

Decided: **live scoreboard** (log chores as you do them), on a weekly cycle.

```
Plan (occasionally)      Log (daily)              Resolve (weekly)
─────────────────────    ────────────────────     ──────────────────────
Tune E/A/M scores    →   Tap a chore as done  →   Sunday recap
Set frequencies          Points burst             Beam verdict
                         Beam tilts live          Streak +1 if balanced
                         Household streak         Ledger resets to zero
                              ↑                        │
                              └────────────────────────┘
```

**Daily:** open, tap what you did, see the beam respond. Target interaction
time: under 10 seconds.

**Weekly:** a recap screen — what the split was, which categories drove it,
where the mental load actually sat, and one concrete suggestion for next week.
Then everything zeroes.

## 4. Scoring model

Each chore is scored on three independent (MECE) dimensions, 1–5 each:

| Dimension | What it measures | High example | Low example |
|---|---|---|---|
| **Effort** (E) | Physical / time drain per session | Mowing the lawn | Wiping a counter |
| **Aversion** (A) | How unpleasant, gross or boring — the "I'd pay to avoid this" factor | Cleaning the toilet | Watering plants |
| **Mental load** (M) | Planning, remembering, deciding, coordinating | Meal planning | Vacuuming |

```
points per session = E + A + M          (range 3–15)
weekly load        = points × times done per week
```

Multiplying by frequency is what makes a daily two-minute task correctly
outweigh a rare heavy one.

### Why mental load is its own axis

This is the central fix. Scoring only Effort and Aversion reproduces exactly
the bias the app exists to correct — it counts the cooking and ignores the
deciding-what-to-cook. Making M a first-class dimension means "meal planning"
scores 7/session on almost no physical effort, which is the honest number.

### Known limitations (stated, not hidden)

- **Scores are only as honest as the inputs.** The default E/A/M values are a
  starting point. If Alix and David disagree that toilets deserve Aversion 5,
  the defaults are wrong for this household and must be retuned together. The
  app must make retuning easy (see §6, Tune screen).
- **The point total can read "balanced" when the experience isn't.** If one
  person's points come mostly from Effort and the other's mostly from Mental
  load, the beam levels but the lived experience differs — carrying everything
  in your head is more draining than the sum suggests. **Mitigation:** the app
  always shows the split *by dimension*, not just the total. This is a required
  feature, not a nice-to-have.
- **⚠️ Live logging biases toward visible work.** This is a real tension
  introduced by the live-scoreboard model: you naturally tap "did the dishes",
  but nobody taps a button when they *remember* that the car needs servicing.
  Left unaddressed, the logging model quietly recreates the original bias.
  **Mitigations:** (a) mental-load chores are first-class loggable items
  phrased as actions ("planned the week's meals", "booked the dentist",
  "noticed we were low on X and restocked"); (b) the weekly recap explicitly
  prompts for any invisible work not logged; (c) recurring mental-load chores
  can be set to auto-accrue weekly, since they happen whether or not anyone
  taps.

## 5. Data model

```
Household        id, name, created_at, week_starts_on
Person           id, household_id, display_name, colour, avatar
Chore            id, household_id, name, category, effort, aversion,
                 mental_load, default_frequency, is_active
                 └─ derived: points_per_session = E + A + M
LogEntry         id, chore_id, person_id, logged_at, points_snapshot
                 └─ points_snapshot freezes the score at log time, so
                    retuning E/A/M never rewrites history
Week             id, household_id, starts_on, ends_on, final_split,
                 streak_continued
Achievement      id, household_id, person_id, kind, earned_at
```

**Key decision:** `LogEntry.points_snapshot` stores the points as they were
when logged. Retuning scores changes the future, never the past — otherwise
last week's balance silently rewrites itself and the app loses trust.

### Categories & seed chores

Kitchen & food · Bathroom · Laundry & clothes · Floors & surfaces · Bins &
recycling · **Admin & mental load** · Outdoor & occasional

Seeded from the existing draft table (~33 chores with default E/A/M and
frequency), fully editable. Irrelevant chores can be deactivated rather than
deleted.

## 6. Screens

| Screen | Purpose | Notes |
|---|---|---|
| **Today** (home) | The daily 10-second loop. Chore list, one tap to log. Beam at top. Streak visible. | The screen that must be beautiful and fast. Everything else is secondary. |
| **Balance** | The live beam, split by person *and by dimension* (E / A / M). | Where the mental-load insight lives. |
| **Week recap** | Sunday summary, verdict, one suggestion, streak resolution, reset. | The emotional payoff of the week. |
| **Tune** | Edit chores, E/A/M scores, frequencies, add/remove. | Designed to be used *together*, occasionally. |
| **Setup** | Create household, invite partner, pick colours/avatars. | One-time. |

## 7. Gamification

The mechanics that drive daily use, ranked by expected impact:

1. **Instant feedback on log** — a point burst, a haptic tap, the beam visibly
   moving. The single highest-leverage detail in the app. If tapping a chore
   doesn't feel good, nothing else matters.
2. **Shared household streak** — consecutive weeks ending balanced. One flame,
   both feed it. Cooperative by construction.
3. **The beam** — always visible, always live. Ambient, not nagging.
4. **Weekly recap** — a small moment of closure and a fresh start.
5. **Achievements** — earned for the *unglamorous* work specifically, to
   counterweight the tendency to cherry-pick easy tasks. e.g. *Toilet Duty*
   (10 grim jobs), *Mind Reader* (25 mental-load chores), *Deep Clean*
   (a 12+ point single task).

**Explicitly rejected mechanics:** individual streaks (punishing, blame-
generating), leaderboards against other households (privacy, and irrelevant),
push notifications that nag (fastest route to deletion — notifications are
opt-in and limited to the weekly recap).

## 8. Design direction

**Elegant base, playful reward layer.**

The resting state is calm, typographic and grown-up — generous whitespace,
restrained palette, precise numbers. The playfulness lives entirely in the
*interaction moments*: the burst when you log, the beam's spring animation, the
streak flame, the recap reveal.

Rationale: Strava and Duolingo are not childish apps. Their base layer is
sober; the delight is in the reward moments. A cartoon-styled base would read
as twee for two adults and get abandoned by week three, while a purely
editorial design has no pull to open it. This hybrid takes the beauty of the
former and the retention of the latter.

**Visual system:**
- Two person-colours (teal / violet by default, editable) used consistently
  across beam, chips and charts — colour *is* identity in this app.
- Typography: a distinctive display face for headings and numbers, a neutral
  workhorse for body, a mono for scores and data.
- Motion: spring physics on the beam; short, sharp bursts on log. Respect
  `prefers-reduced-motion`.
- Dark and light modes, both first-class.
- Mobile-first. This is a phone app used standing in a kitchen.

## 9. Stack

| Layer | Choice | Why |
|---|---|---|
| UI | **React + Vite + TypeScript** | Live shared state and several screens make components worth it. Fast build, great DX. |
| Styling | **Tailwind CSS** | Rapid iteration on a custom design system without fighting a component library's opinions. |
| Motion | **Framer Motion** | Spring physics for the beam and reward bursts — the core of the "feel". |
| Backend | **Supabase** (Postgres + Realtime + Auth), free tier | Both phones see the same live data. Realtime subscriptions mean the beam moves on your phone when Alix logs on hers. Auth via email magic link. |
| Hosting | **GitHub Pages** | Free, from this repo, at `github.io` as you wanted. Static host is fine since Supabase is the backend. |
| Install | **PWA** (installable, offline-tolerant) | Home-screen icon is critical for a daily-tap habit. Offline queue so logging works with bad kitchen wifi. |

**Notes & risks:**
- Supabase's anon key is public by design; security comes from **Row Level
  Security** policies scoped to `household_id`. RLS must be configured before
  any real data goes in — this is the one security-critical step.
- GitHub Pages serves static files only, so routing uses hash-based or
  `404.html` fallback.
- Free tier limits are far beyond a two-person household's usage.
- Realtime sync is the main source of build complexity; local-first state with
  optimistic updates keeps the UI instant regardless of network.

## 10. Build phases

- **Phase 1 — The feel.** Today screen, beam, log interaction, seed chores,
  local state only. Goal: prove the 10-second loop is delightful before adding
  any infrastructure.
- **Phase 2 — Shared.** Supabase schema + RLS, auth, household invite, realtime
  sync across both phones.
- **Phase 3 — The week.** Recap screen, streak, weekly reset, achievements.
- **Phase 4 — Tuning & polish.** Tune screen, dimension-split view, PWA,
  offline queue, dark mode.

## 11. Open questions

1. Does Alix's existing set of rules change any chore, score or frequency here?
   Her rules should be reconciled into the seed data before Phase 1.
2. Should a chore be assignable as "owned" by one person (a plan) in addition
   to being logged ad hoc, or is logging alone enough?
3. How should a chore done *together* be logged — 50/50 split, or each person
   logs their own contribution?
4. Weekly reset day — Sunday evening assumed.
5. Should wedding logistics live in this app, or is it a separate project with
   its own lifespan?
