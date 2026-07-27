# HomeRanking — Product & Design Spec

**Version:** 0.1 (draft for review)
**Owners:** Alix & David
**Status:** Phase 1 built — weekly tracker, local state only

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

Decided: **weekly counters** — bump a chore's count whenever you like, with no
obligation to log daily and no validation step.

```
Plan (occasionally)      Log (any time)            Resolve
─────────────────────    ──────────────────────    ──────────────────────
Tune E/A/M scores    →   Bump a chore's count  →   Sunday: weekly recap,
Set weekly targets       Points update             beam verdict, streak,
Add / remove chores      Beam tilts live           week resets
                              ↑                    1st: monthly ranking
                              └──────────────────────────┘
```

**Any time:** open, bump what you've done, see the beam respond. A missed day
is not a failure and leaves no empty cell — catching up on Sunday is a
supported way to use the app, not a lapse.

**Weekly (Sunday):** a recap — the split, which categories drove it, where the
mental load sat, target vs. logged, and one concrete suggestion. Then the week
zeroes.

**Monthly (1st):** the monthly ranking closes and resets, keeping a longer view
than the weekly cycle alone.

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

Full anchors for each level, the seed chore table and the derived analysis live
in [CHORES.md](./CHORES.md).

### Input method: three levels, not sliders

Each dimension is set in settings as **Small / Medium / High** — three levels
only, scored 1 / 3 / 5. Asking for numeric values across 43 chores is enough
friction to lose the user during setup.

**Levels 2 and 4 are deliberately excluded.** If the settings screen offers
only S/M/H, then a seed value of 2 or 4 is one the household cannot reproduce
or edit back to — the defaults would be quietly un-editable. Three levels give
seven distinct point totals (3, 5, 7, 9, 11, 13, 15), which is ample.

### Why not time-based weighting

Time in minutes is the intuitive choice and the wrong one:

- It **punishes efficiency** — get faster at a chore, earn fewer points.
- It **flattens aversion** — 20 minutes scrubbing a toilet ≠ 20 minutes
  folding laundry in front of the TV.
- **Mental load has no duration.** Carrying "the car service is due" occupies
  no minutes and three weeks of headspace, so a time-based system scores the
  invisible work at zero — reintroducing the exact bias this app exists to fix.

Time estimates are still displayed per chore as **metadata**, to keep the
numbers grounded and sanity-checkable. They never drive the score.

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
Chore            id, household_id, name, category, emoji, sort_order,
                 effort, aversion, mental_load,        ← the score
                 weekly_target, est_minutes,           ← metadata
                 allows_multi_log, fixed_window, is_active
                 └─ derived: points_per_session = E + A + M
LogEntry         id, chore_id, person_id, logged_on (date), count,
                 points_snapshot, was_together, note
                 └─ points_snapshot freezes the score at log time, so
                    retuning E/A/M never rewrites history
Week             id, household_id, starts_on, ends_on, final_split,
                 streak_continued
Achievement      id, household_id, person_id, kind, earned_at
```

**Key decision:** `LogEntry.points_snapshot` stores the points as they were
when logged. Retuning scores changes the future, never the past — otherwise
last week's balance silently rewrites itself and the app loses trust.

> **Implemented for synced history.** `entries.points` now freezes the score at
> write time, so retuning a chore in settings no longer rewrites past weeks in
> the all-time view. Two caveats: the *current* week's headline still
> recalculates from live scores, which is intentional while the week is open;
> and local-only history (used before a household is connected) has no snapshot,
> so it recalculates from current scores throughout.

### Scoring vs. metadata

Only three fields drive points: `effort`, `aversion`, `mental_load`. Everything
else on a chore is metadata. This separation is deliberate — see §4 on why no
fourth scoring dimension is added.

| Attribute | Purpose |
|---|---|
| `weekly_target` | Expected times per week. **Not a multiplier** — see below. |
| `est_minutes` | Displayed to keep numbers grounded. Never scored. |
| `allows_multi_log` | Whether a chore can be logged more than once a day. |
| `fixed_window` | Has a hard deadline/day (bin day). Drives reminders, not points. |
| `emoji`, `sort_order` | Personality and manual ordering in the grid. |
| `is_active` | Deactivated chores keep their history but leave the totals. |

### Frequency becomes a target, not a multiplier

With daily logging, weekly load is **what was actually logged**, not
`points × frequency`. `weekly_target` is retained as an expectation, which
gives the recap a genuinely useful line: *"dishes — target 7, logged 5."*

### Logging rules

- **Multi-log.** Tap once to log; tap again to increment `count`. The row
  shows a count badge above 1.
- **Correcting a mis-tap** — three layers, because mistakes surface at three
  different moments:
  1. **Immediately** — an undo toast appears on every log (`+6 pts · Annuler`).
     This catches the large majority of mis-taps, since that is when they are
     noticed.
  2. **Same week** — long-press the item to open a stepper (`− count +`) with
     a delete. Past days in the current week stay editable, matching Ludus's
     *"Modifier la journée d'hier"*.
  3. **Older** — delete the entry from the Journal.
- **Done together.** Both people tap it; each receives full points and the
  entries are tagged `was_together`. This does not distort the balance —
  adding equal points to both leaves the ratio unchanged — but it does inflate
  the household total, so the recap compares **ratio against 50/50**, never
  total against target.
- **Self-reported, never approved.** There is no validation step (see §9).

### Categories & seed chores

Kitchen & food · Bathroom · Laundry & clothes · Floors & surfaces · Bins &
recycling · **Admin & mental load** · Outdoor & occasional

Seeded from the existing draft table (~33 chores with default E/A/M and
frequency), fully editable. Irrelevant chores can be deactivated rather than
deleted.

## 6. Screens

| Screen | Purpose | Notes |
|---|---|---|
| **Today** (home) | **One tab per person.** Your own chore list, grouped into collapsible categories with `0/4`-style counters, one tap to log. Big daily point total at the top. | The screen that must be beautiful and fast. Everything else is secondary. |
| **Balance** (summary) | The live beam, split by person *and by dimension* (E / A / M), plus **weekly and monthly rankings**. | Where the mental-load insight lives, and where the two tabs are compared. |
| **Journal** | Chronological log of every entry: date, person, chore, points. Searchable, exportable. | Builds trust — the numbers are auditable rather than asserted. Adapted from the reference app. |
| **Week recap** | Sunday summary, verdict, target-vs-logged, one suggestion, streak resolution, reset. | The emotional payoff of the week. |
| **Tune** (settings) | Add / edit / deactivate / reorder chores, set E/A/M via S/M/L, set target, emoji and time estimate. Export / import. | Designed to be used *together*, occasionally. Adding a chore must take under ~15 seconds: name, emoji, category, three taps, target. Unused chores are **deactivated, not deleted**, so they stop distorting totals without losing history. |
| **Setup** | Create household, invite partner, pick colours/avatars. | One-time. |

### Logging model: weekly counters, not a daily grid

**Decided:** logging is by **weekly counter per chore**, not per day. Each
chore is one row with a stepper (`− 3 +`) and the week's points beside it. You
bump the count whenever you like — during the week, or in one sweep on Sunday.

Options considered, scored against the requirement (weekly vision, no daily
obligation, a missed day is not a failure, ranking updates automatically, no
validation step):

| | A. Daily grid | B. Weekly counters | C. Weekly checklist | **D. Counters + silent timestamp** |
|---|:-:|:-:|:-:|:-:|
| Catch up after missing days | 4 | 10 | 10 | **10** |
| Speed to log | 6 | 9 | 10 | **9** |
| Accuracy of the data | 9 | 7 | 4 | **8** |
| Guilt-free (no empty cells) | 3 | 9 | 9 | **9** |
| Keeps Journal & stats useful | 9 | 5 | 3 | **9** |
| Build cost | med | low | low | **low** |
| **Total** | 31 | 40 | 36 | **45** |

**C is disqualified regardless of score:** a binary "did I do this?" destroys
frequency, and frequency is the model. Washing up once and washing up seven
times would score identically.

**D is chosen.** The counter is what the user sees; the app records the
timestamp silently so the Journal and stats stay rich, without ever asking
which day something happened or showing an empty cell.

**Consequences:**
- "Today" becomes **"This week"**; the big number is a weekly total; the
  `0/4` progress counters become `3 / 7` against target.
- **The stepper replaces the whole undo mechanism.** Mis-tapped? Press `−`.
  No toast, no long-press, no Journal dive.
- Points push straight to the ranking — **no validation step**, consistent
  with §7b.

**Known downside, accepted:** counters rely on memory, and one-sweep Sunday
logging systematically under-reports. Mitigated by the counter being available
all week, and by the fact that under-reporting affects both people, so the
*balance* stays roughly honest even when totals sag.

### Today: one tab per person

Each person gets their own tab and taps their own list, so there is no picker
and no ambiguity about who did what. Structure follows Ludus's *Aujourd'hui*:

- **Big daily point total** at the top — the single most motivating element.
- **Collapsible category sections** with `0/4`-style progress counters.
  Essential once the list passes ~30 chores.
- **Edit yesterday**, and any day in the current week.

**Trade-off accepted:** a single shared chore × day grid would show the whole
week's distribution at a glance — a colour pattern you could read without
numbers. Per-person tabs lose that. The Balance screen has to earn it back,
which is reasonable since the beam and E/A/M split already live there.

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
opt-in and limited to the weekly recap), and a **rewards catalogue** of any
kind — dropped at the household's request, keeping the app to tracking rather
than bartering.

## 7b. What we take from the reference app — and what we must not

The reference (`salommichael.github.io/Nola-James`) is a parent→child app. Its
structure encodes an **authority relationship**. HomeRanking is peer-to-peer,
so some of its best-looking features are actively wrong here.

**Adopt:**

| Feature | Why |
|---|---|
| Weekly chore × day grid | The core interaction. Fast, legible, one tap. |
| Journal / audit log | Makes the numbers auditable, which makes them trustworthy. |
| Export to Excel | Cheap to build, useful for a periodic proper look at the data. |
| Export / import backup | Essential safety net for self-hosted data. |
| Drag-to-reorder, emoji per item | Personality and control, very cheap. |
| Granular reset (by category) | Better than one destructive "reset everything". |
| Demo mode with shareable link | Lets you show friends without exposing real data. |

**Reject:**

| Feature | Why it fails between partners |
|---|---|
| "Valider la journée / la semaine" | Validation means one person approves another's work. Between adults that is supervision, and it converts a shared tool into a power dynamic. **Logging is self-reported, full stop.** |
| Punishments catalogue (XS/S/M/L durations) | Correct for a 3-year-old drawing on the walls. Between partners, a system that assigns penalties is the single fastest way to make the app a weapon. |
| Per-child star balances as private currency | Reinforces "my points vs. yours" — the exact ledger dynamic §2 exists to prevent. |

### Second reference: Ludus (habit tracker with leagues)

**Adopt:** big daily point total; collapsible category sections with `0/4`
counters; edit-yesterday; a Stats screen.

**Reject — "ÉCARTS" (negative points, capped at −15/day).** Ludus is a *solo*
self-improvement app, so deducting 10 points for alcohol is self-directed and
harmless. Between partners, a control that subtracts points from the other
person is a weapon. This is the third instance of the same underlying pattern
(validation, punishments, penalties): each is fine in an app with one user or
an authority relationship, and each fails in a peer relationship.

**Ranking — adopted, with the headline reserved for balance.** The household
wants a ranking and the project is named for it. A two-person ranking is the
beam with a winner named, so: the balance is the headline, the ranking sits
beneath it.

**Two ranking periods**, following Ludus's monthly league:

| Period | Resets | Purpose |
|---|---|---|
| **Weekly** | Sunday | The active cycle — drives the recap and the streak. |
| **Monthly** | 1st of the month | A longer view. One heavy week matters less; persistent patterns show up. |

The weekly reset still guarantees no debt accumulates (§2) — the monthly
ranking is a *view over history*, not a running balance to settle. It shows
totals and the split, never "who owes whom".

**League of households (v2, proposed).** Ludus's league uses an invite code. A
league of two people is zero-sum, but a league of *households* is not: Alix and
David as one team, competing with friends' households on total load cleared per
month. This preserves "the opponent is the housework, not your partner" while
adding real competitive pull, and pairs naturally with the shareable demo link.

## 8. Design direction

**Three layers, not three styles.** Editorial, data-viz and playful are not
competing directions — they own different pixels and different moments, so the
app runs all three at once.

| Layer | Owns | Direction |
|---|---|---|
| **Base** — layout, type, spacing, colour | ~80% of the screen, at rest | Elegant & editorial |
| **Data** — beam, E/A/M split, recap charts | The numbers, wherever they appear | Bold data-viz |
| **Reward** — log burst, beam spring, streak, recap reveal | Moments, not surfaces | Playful |

Rationale: Strava and Duolingo are not childish apps. Their base layer is
sober; the delight is in the reward moments. A cartoon-styled base would read
as twee for two adults and get abandoned by week three, while a purely
editorial design has no pull to open it.

**The failure mode to guard against is clutter, not conflict.** Bold data-viz
done badly means twelve widgets on one screen. Done well it means *one hero
chart, rendered confidently* — which stays fully compatible with editorial
calm. One screen, one hero.

### The concrete solution — how each axis reaches 9

The three-layer model above is the principle. This is the build.

| Element | Decision |
|---|---|
| **Palette** | Warm off-white base, near-black ink. Exactly **two saturated colours** in the whole app — one per person (teal / violet). Colour *is* identity: if it's coloured, it means a person. |
| **Type** | A geometric display face for headings and the big numbers; a neutral sans for body; a mono for scores and counters. Numbers are the app's typography — they get the personality. |
| **Hero** | **One** element per screen. On *This week* it's the weekly total; on *Balance* it's the beam. Never two heroes competing. |
| **Density** | Collapsible category headers with `12 / 34` counters. Collapsed by default once the list is long, so the screen opens short. |
| **Motion** | Spring physics on the beam; the total **counts up** rather than jumping; a brief pulse on the row you bumped. No confetti, no mascot. |
| **Dark mode** | First-class, not an inversion. Both themes designed. |

Axis by axis:

- **Visual wow → 9.** Editorial whitespace plus one confident hero. Restraint
  everywhere else is what makes the hero land.
- **Drives daily use → 9.** The weekly total counting up on every tap is the
  reward moment. Collapsible sections keep the screen short enough to feel
  effortless. The remaining point would need guilt mechanics, which are out.
- **Feels adult → 9.** All the playfulness is in motion and none in styling.
  No cartoon, no mascot, no rounded-everything.
- **Mental load legible → 10.** A dedicated E / A / M split bar on *Balance*,
  always visible, never collapsed into a single total. This is the one place
  the app is deliberately *more* explicit than it needs to be.
- **Ages well → 9.** A calm base doesn't fatigue; a novelty base does.

**On maximising daily use.** The design targets ~9/10 on drives-daily-use, not
10/10, and that gap is deliberate. The last point comes from loss-aversion
streaks, variable rewards and nagging notifications. Those work, and every one
of them is rejected here: a mechanic that makes you feel bad for missing a day
is tolerable in a solo app and manufactures blame between partners. Delight,
never guilt.

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
| Styling | **Hand-written CSS + custom properties** | Replaced Tailwind in Phase 1. The design is bespoke rather than composed from utilities, and a token-based stylesheet expresses "colour means a person" directly — the person's hue is one variable the whole tree reads. |
| Motion | **CSS transitions** | Replaced Framer Motion in Phase 1. The app has a handful of animations — the beam, the counting total, a pulse on log — and a spring-ish `cubic-bezier` covers all three. Fewer dependencies, less to break. Revisit only if an interaction genuinely needs physics. |
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

- **Phase 1 — The feel. ✅ Built.** Person tabs, weekly counters with steppers,
  counting total, balance beam, E/A/M split, collapsible categories, light and
  dark. Local state only. Goal: prove the loop is pleasant before adding
  infrastructure.
- **Phase 2 — Shared.** Supabase schema + RLS, auth, household invite, realtime
  sync across both phones.
- **Phase 3 — The week. ✅ Built.** Points frozen at log time, week-by-week
  history, all-time totals, per-person chore tallies, the once-per-week recap
  with its verdict, the shared streak, and the monthly standing.
- **Phase 5 — Journal. ✅ Built.** Every entry, newest first, with CSV export.
  The counters are weekly rather than timestamped, so the journal is honest
  about its granularity rather than pretending to be a live feed.
- **Phase 6 — Polish. ✅ Built.** Emoji per chore, manual reordering, and a
  JSON backup you can download and restore.
- **Phase 4 — Tuning & polish.** Tune screen, dimension-split view, PWA,
  offline queue, dark mode.

## 11. Open questions

**Resolved:**

- ~~Time vs. S/M/L weighting~~ → E/A/M model, S/M/L input, time as metadata.
- ~~Per-person aversion scores~~ → **one shared score per chore**, for
  simplicity. Revisit only if it visibly misrepresents one of you.
- ~~How is a chore done together logged~~ → both tap, both get full points,
  tagged `was_together`.
- ~~Frequency as multiplier~~ → becomes `weekly_target`; actual load is logged.
- ~~Adding missing chores~~ → yes, via the Tune/settings screen, under ~15s.

- ~~Alix's rules~~ → **there is no pre-existing rule set.** Sensible defaults
  plus easy editing in settings is the agreed approach; she shapes the scores
  by using the app rather than by specifying it up front.
- ~~Weekly reset day~~ → **Sunday**.
- ~~Two people in one grid~~ → **one tab per person**, plus a shared Balance
  and summary screen.
- ~~Correcting a mis-tap~~ → the counter's `−` button.
- ~~Cleaner frequency~~ → **once a fortnight**; both cleaner-related chores sit
  at a target of 0.5/week.
- ~~Rewards catalogue~~ → **dropped.** Not wanted.
- ~~Tidying and bin-day tracking~~ → both real; restored as chores.
- ~~Wedding logistics~~ → stays, in the Admin category.

**Open:**

1. Final chore list — pending a last review pass.
2. Weekly targets per chore (how many nights cooking, etc.).
3. Which chores need `fixed_window` (a real deadline) versus merely being
   scheduled?
4. League of households — v2, worth building?
