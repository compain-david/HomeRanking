# Chore table & grading criteria

Seed data for HomeRanking. Every score here is a **starting point**, not a
verdict — the app must make retuning easy, and this household's own judgement
overrides these defaults.

---

## 1. How to grade a chore

Three independent dimensions, each 1–5. Collected in the UI as **S / M / L**
(= 1 / 3 / 5), with 2 and 4 available when a chore sits between anchors.

```
points per session = Effort + Aversion + Mental load     (range 3–15)
weekly load        = points per session × times per week
```

### Effort (E) — physical and time drain per session

| | Anchor | Rough time |
|---|---|---|
| **1** (S) | Trivial, no exertion | under 2 min |
| **2** | Light, brief | 5–10 min |
| **3** (M) | Sustained, moderate | 15–30 min |
| **4** | Heavy, awkward, or long | 45–60 min |
| **5** (L) | Exhausting, whole-body | 1 hour+ |

### Aversion (A) — how much you'd pay to avoid it

| | Anchor |
|---|---|
| **1** (S) | Neutral or genuinely pleasant |
| **2** | Mildly boring |
| **3** (M) | Tedious or unpleasant |
| **4** | Actively disliked, reliably procrastinated |
| **5** (L) | Grim — gross, or dread-inducing |

Aversion is the most **personal** dimension — if one of you finds cooking
relaxing and the other finds it stressful, the "true" score differs by person.
**Decided: one shared score per chore anyway**, for simplicity of setup and
use. Agree it together. Revisit only if it visibly misrepresents one of you.

### Mental load (M) — planning, remembering, deciding, coordinating

| | Anchor |
|---|---|
| **1** (S) | Zero — the task is visible and the method obvious |
| **2** | Slight timing awareness |
| **3** (M) | Must be remembered on a schedule, with no external cue |
| **4** | Requires planning, decisions and tracking |
| **5** (L) | Carried continuously; involves other people or deadlines |

> **The cue test.** *Does the task announce itself?* Dirty dishes are visible —
> M1. Nobody can see that the car service is due in three weeks — M5. This is
> an observable property of the task, not a feeling, which is what makes it
> possible for two people to agree on a score.

### What is deliberately NOT used as the weight

- **Time in minutes.** It punishes efficiency (get faster, score less), it
  treats 20 minutes of scrubbing a toilet as equal to 20 minutes of folding
  laundry in front of the TV, and — fatally — mental load has no duration, so
  a time-based system scores the invisible work at zero.
- **A single S/M/L "size".** Collapses three independent things into one
  number, and mental load is what disappears in the collapse.

Time estimates are still shown per chore as **metadata**, to keep the numbers
grounded and sanity-checkable. They never drive the score.

---

## 2. The table

`freq` = times per week. `pts` = E+A+M per session. `wk` = pts × freq.

### Kitchen & food

| Chore | E | A | M | pts | ≈time | freq | wk |
|---|:-:|:-:|:-:|:-:|---|:-:|:-:|
| Wash dishes / load & empty dishwasher | 3 | 2 | 1 | **6** | 20 min | 7 | 42.0 |
| Wipe counters & stovetop | 1 | 1 | 1 | **3** | 3 min | 7 | 21.0 |
| Cook dinner | 3 | 1 | 3 | **7** | 40 min | 5 | 35.0 |
| Meal planning & grocery list | 1 | 1 | 5 | **7** | 15 min | 1 | 7.0 |
| Grocery shopping | 3 | 2 | 2 | **7** | 50 min | 1 | 7.0 |
| Unpack & put away shopping | 2 | 2 | 1 | **5** | 15 min | 1 | 5.0 |
| Clean fridge & sort leftovers | 2 | 3 | 2 | **7** | 20 min | 0.5 | 3.5 |
| Deep clean oven | 4 | 4 | 1 | **9** | 60 min | 0.25 | 2.25 |

### Bathroom

| Chore | E | A | M | pts | ≈time | freq | wk |
|---|:-:|:-:|:-:|:-:|---|:-:|:-:|
| Clean toilet | 2 | 5 | 1 | **8** | 10 min | 1 | 8.0 |
| Clean shower & bath | 3 | 3 | 1 | **7** | 20 min | 1 | 7.0 |
| Wipe sink & mirror | 1 | 1 | 1 | **3** | 5 min | 1 | 3.0 |
| Notice & restock loo roll / soap | 1 | 1 | 4 | **6** | 5 min | 1 | 6.0 |
| Clear drain / plughole | 2 | 5 | 2 | **9** | 10 min | 0.25 | 2.25 |

### Laundry & clothes

| Chore | E | A | M | pts | ≈time | freq | wk |
|---|:-:|:-:|:-:|:-:|---|:-:|:-:|
| Wash & dry a load | 2 | 1 | 2 | **5** | 10 min | 3 | 15.0 |
| Fold & put away | 2 | 3 | 1 | **6** | 20 min | 3 | 18.0 |
| Ironing | 3 | 4 | 1 | **8** | 30 min | 1 | 8.0 |
| Change bed sheets | 3 | 2 | 3 | **8** | 15 min | 0.5 | 4.0 |
| Dry cleaning, repairs, seasonal swap | 1 | 2 | 4 | **7** | 20 min | 0.1 | 0.7 |

### Floors & surfaces

| Chore | E | A | M | pts | ≈time | freq | wk |
|---|:-:|:-:|:-:|:-:|---|:-:|:-:|
| Vacuum | 3 | 1 | 1 | **5** | 25 min | 2 | 10.0 |
| Mop | 3 | 2 | 2 | **7** | 25 min | 1 | 7.0 |
| Dust surfaces | 2 | 2 | 2 | **6** | 20 min | 1 | 6.0 |
| Tidy & declutter shared spaces | 2 | 2 | 3 | **7** | 10 min | 5 | 35.0 |
| Clean windows | 3 | 2 | 1 | **6** | 45 min | 0.1 | 0.6 |

### Bins & recycling

| Chore | E | A | M | pts | ≈time | freq | wk |
|---|:-:|:-:|:-:|:-:|---|:-:|:-:|
| Rubbish out on collection day | 2 | 3 | 4 | **9** | 5 min | 1 | 9.0 |
| Sort & take out recycling | 2 | 2 | 3 | **7** | 10 min | 1 | 7.0 |
| Replace bags & clean the bin | 1 | 4 | 2 | **7** | 10 min | 0.5 | 3.5 |

> "Rubbish out" scores 9 on a 5-minute task. That is the model working: the
> effort is trivial, but it has a hard deadline, no cue, and a week-long
> consequence for missing it. Whoever holds that reminder is doing real work.

### Admin & mental load

| Chore | E | A | M | pts | ≈time | freq | wk |
|---|:-:|:-:|:-:|:-:|---|:-:|:-:|
| Pay bills & manage budget | 1 | 3 | 5 | **9** | 30 min | 1 | 9.0 |
| Book & track appointments | 1 | 2 | 5 | **8** | 15 min | 1 | 8.0 |
| Birthdays, gifts & social calendar | 2 | 1 | 5 | **8** | 20 min | 1 | 8.0 |
| Track household supplies running low | 1 | 1 | 5 | **7** | — | 1 | 7.0 |
| Insurance, renewals, paperwork | 1 | 4 | 5 | **10** | 45 min | 0.25 | 2.5 |
| Coordinate repairs & tradespeople | 2 | 4 | 5 | **11** | 60 min | 0.1 | 1.1 |
| Wedding logistics & coordination | 3 | 2 | 5 | **10** | 90 min | 3 | 30.0 |

### Outdoor & occasional

| Chore | E | A | M | pts | ≈time | freq | wk |
|---|:-:|:-:|:-:|:-:|---|:-:|:-:|
| Water plants | 1 | 1 | 2 | **4** | 5 min | 3 | 12.0 |
| Mow lawn / garden tidy | 4 | 2 | 2 | **8** | 60 min | 0.5 | 4.0 |
| Car maintenance, service, admin | 2 | 3 | 5 | **10** | 60 min | 0.1 | 1.0 |
| Wash the car | 3 | 2 | 1 | **6** | 40 min | 0.25 | 1.5 |
| Declutter / reorganise a room | 4 | 2 | 3 | **9** | 2 hr | 0.1 | 0.9 |

---

## 3. What the numbers say

**Total household load ≈ 358 points/week** (≈ 328 excluding wedding logistics).

### Mental load is ~35% of the total

Roughly **127 of those 358 points** come from the Mental load dimension —
work that a conventional time-or-effort scoring system counts as zero. That
figure alone justifies the three-dimension model.

### The two rankings are almost completely different lists

**Heaviest per session** — the grim, rare, heavy jobs:

| # | Chore | pts |
|---|---|---|
| 1 | Coordinate repairs & tradespeople | 11 |
| 2 | Insurance, renewals, paperwork | 10 |
| 2 | Car maintenance, service, admin | 10 |
| 2 | Wedding logistics | 10 |
| 5 | Deep clean oven / Clear drain / Rubbish out / Bills / Declutter | 9 |

**Heaviest per week** — the small, relentless, daily ones:

| # | Chore | wk |
|---|---|---|
| 1 | Wash dishes | 42.0 |
| 2 | Cook dinner | 35.0 |
| 2 | Tidy & declutter shared spaces | 35.0 |
| 4 | Wedding logistics | 30.0 |
| 5 | Wipe counters & stovetop | 21.0 |

Two things follow. First, **the top of the per-session list is dominated by
invisible admin** — four of the top five are mental-load-heavy tasks that
barely register as "chores" in most households. Second, **frequency changes
everything**: wiping counters is the lowest-scoring task in the entire table
at 3 points, and it still outranks deep-cleaning the oven by nearly 10× over a
week. Any system that ignores frequency gets this exactly backwards.

The app should show both rankings. They answer different questions: *"what's
the worst job?"* and *"where does my week actually go?"*

---

## 4. Open questions on this table

1. **⚠️ Alix's existing rules — still the biggest gap, and still not shared.**
   Every score in this table is a default written without sight of them. If
   her rules disagree with anything above, hers win. **Nothing in this file
   should be presented to her as reflecting her rules.**
2. **`freq` here is now a weekly *target*, not a multiplier** (see SPEC §5).
   The `wk` column is therefore an *expected* load used for planning and for
   the recap's "target vs. logged" line — real weekly load comes from what
   gets logged.
3. **Targets are guesses.** Do you cook 5 nights or 6? Is the flat vacuumed
   twice a week? These move the expected totals more than the scores do.
4. **Missing chores** — this list is generic. What's specific to your home
   that isn't here? Add them in the Tune screen.
5. **Chores that don't apply** — lawn, car — should be deactivated rather than
   scored, so they don't distort the totals.
