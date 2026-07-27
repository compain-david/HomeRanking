# HomeRanking — design handover

For a designer picking this up cold, or for a Claude Design session. It covers
what the app is, what the current design does and why, what is safe to change,
and what will break the product if changed.

**Live:** https://compain-david.github.io/HomeRanking/
**Repo:** `compain-david/HomeRanking`, branch `claude/chore-scoring-system-1p6bpg`

---

## 1. What this is

A household load tracker for **two adults living together — Alix and David.**
Not a to-do list and not a family chore chart. It exists to answer one question
honestly: *who is actually carrying the work here, including the invisible
part?*

Every chore is scored on three dimensions, each Small / Medium / High (1/3/5):

| Dimension | What it measures |
|---|---|
| **Effort** | Physical and time drain per session |
| **Aversion** | How unpleasant, gross or boring — "I'd pay to avoid this" |
| **Mental load** | Planning, remembering, deciding, coordinating |

`points = Effort + Aversion + Mental load`, and a week's total is points ×
however many times you logged it.

**Mental load is the entire reason the app exists.** Conventional chore apps
count the cooking and ignore the deciding-what-to-cook, which systematically
undercounts whoever carries the household in their head. In this household's
own data, mental load is **44% of the total weekly load — nearly double
physical effort.**

## 2. How it is used

Opened on a phone, standing in a kitchen, for about ten seconds. Not read,
**operated.** Any design that is beautiful to look at but slower to tap is a
regression.

- One tab per person; you tap your own list, so there is never a "who did
  this?" picker.
- Logging is a **weekly counter**, not a daily checkbox. Bump a chore whenever;
  catching up on Sunday is a supported way to use it, not a failure. There is
  deliberately no empty grid to feel guilty about.
- No approval step anywhere. Neither person validates the other's work.

## 3. Principles that must survive a redesign

These are not stylistic preferences. Breaking them breaks the product.

1. **Colour means a person. Nothing else.** Alix is teal, David is violet, and
   they are the only two saturated hues in the app. Effort / Aversion / Mental
   load are distinguished by **tone of whoever's colour is active**, never by
   introducing more hues. This is why the dimension bars need no legend of
   their own and why the whole UI shifts colour when you switch tabs.
2. **The mental-load comparison is the payload.** The screen must let you see
   that two identical totals are made of different things. If a redesign makes
   the totals prettier but buries the composition, it has removed the reason
   the app exists.
3. **Balance is the headline; ranking sits underneath.** The household asked
   for a ranking and the project is named for one, but a two-person leaderboard
   is one partner losing. Level beam first, numbers second.
4. **No mechanic that makes someone feel bad.** No streaks that punish, no
   negative points, no nagging notifications, no approval of one person's work
   by the other. Every one of these was considered and rejected — they are fine
   in a solo habit app and corrosive between partners.
5. **Tapping never waits for the network.** Local state is what you see; the
   sync follows.

## 4. Current design system

Deliberately restrained, because the numbers are the content.

**Colour** — neutrals carry a faint green-grey bias so they sit with the teal.
Both themes are first-class; dark is not an inversion.

| Token | Light | Dark |
|---|---|---|
| `--paper` ground | `#f1f3f0` | `#0e1211` |
| `--card` | `#fbfcfa` | `#171c1a` |
| `--sunken` | `#e8ebe6` | `#1f2523` |
| `--ink` | `#141917` | `#e6eae6` |
| `--muted` | `#4a544f` | `#a7b1ab` |
| `--faint` | `#626d68` | `#869089` |
| `--alix` | `#16706a` | `#3fa39b` |
| `--david` | `#5b4bc4` | `#8b7df0` |
| `--tilt` (warning) | `#b4762a` | `#d69a4c` |

The ground also carries two very low-alpha radial washes in the two people's
own colours, so the page reads as lit rather than flat without adding a hue.

**Type** — Familjen Grotesk (display, headings and big numbers), Public Sans
(body), DM Mono (all data, counters, scores). The numbers carry the
personality; everything else is quiet.

**Shape and motion** — radii 10 / 18 / 28px. One staged entrance on load using
`cubic-bezier(0.16, 1, 0.3, 1)`. The beam springs. The weekly total counts up
rather than jumping. Nothing else animates.

**The hero** is the balance beam: two arms off a central fulcrum, Alix growing
left, David growing right, each scaled against the heavier person. Equal arms
read as balance without reading a number. An earlier version drew this as a
single split bar and it read as a progress bar — worth knowing before
redesigning it.

## 5. Hard constraints

- **Mobile-first.** Max content width 460px. Desktop is a courtesy.
- **Every tap target ≥ 44×44px.** This was measured and fixed once already; the
  primary action is the full width of a chore row.
- **All text passes WCAG AA** (4.5:1 for small text) in **both** themes. This
  was measured, not eyeballed, and it is the main reason to be careful with
  translucency — glass over varying content is the fastest way to break it.
  There is exactly one blurred surface (the sticky panel) and no glass on data.
- **Offline.** It is an installed PWA with a service worker; logging must work
  with no connection. Fonts come from Google Fonts and are the one thing that
  degrades offline — self-hosting them would fix that.
- **Static hosting** on GitHub Pages, no server. Supabase is the only backend.
- `prefers-reduced-motion` is respected.

## 6. What exists

| Screen | State |
|---|---|
| **This week** — person tabs, weekly total, beam, dimension comparison, collapsible categories, chore rows with `− n +` | Built |
| **Chores & scores** (⚙) — edit name, S/M/H per dimension, weekly target, add, hide, delete | Built |
| **Sync** — chip in the header, share-link joining | Built |
| **Week close, all-time totals, streak, monthly ranking** | In progress |
| **Journal, Excel export, reordering** | Not started |

**Files worth reading first:** `src/App.tsx` (the week screen), `src/Settings.tsx`,
`src/styles.css` (all tokens at the top), `docs/SPEC.md` (every decision and why),
`docs/CHORES.md` (the scoring anchors and the data).

## 7. What the household wants changed

**The design reads as too simple and not modern enough.** That is the brief.

Three references were supplied — a dark two-column sign-up with a video hero, a
wellness quiz in a phone frame with liquid-glass cards, and an iOS showcase with
66px Garamond display type and choreographed reveals. What was already taken
from them: a larger type scale, bigger radii, a lit rather than flat ground, a
real selected state on logged rows, and staged entrance motion.

What was deliberately **not** taken, and why a redesign should think twice
before reintroducing it:

- **Background video** — battery, data, and motion competing with the numbers,
  in an app opened for ten seconds a day.
- **Heavy glass everywhere** — breaks the AA contrast that took a full pass to
  achieve.
- **Two-column layouts and social sign-in furniture** — no sign-up flow exists,
  and it is a phone app.

The distinction worth holding: those references are built to be **admired
once**. This is built to be **used daily**. Craft transfers — type scale,
radius, motion, depth, density. Spectacle does not.

## 8. Open design problems worth solving

1. **38 chores across 7 collapsible sections is still a hunt.** The single
   biggest remaining usability gap. A "most-logged first" surface, a search, or
   a smarter default ordering would all help.
2. **The dimension comparison is the most important element and currently looks
   like a settings card.** It deserves more presence than it has.
3. **The week has no ending.** No recap, no moment of closure. This is what
   Phase 3 adds, and it is the natural home for a genuinely designed moment.
4. **Empty state is flat.** A first-run screen with nothing logged is
   uninviting and is the first thing a new user sees.
5. **The chore row carries four pieces of information** (name, three dimension
   ticks, points, target) in a small space, and the ticks are nearly invisible.
   Either make them legible or drop them.
