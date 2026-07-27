# Chore table & grading criteria

Seed data for HomeRanking, rebuilt from David's review. **Scores below are
defaults only** — Alix and David will set E/A/M themselves in the settings
screen, and their values override everything here.

---

## 1. How to grade a chore

Three independent dimensions, each set as **Small / Medium / High** in the
settings screen — three levels only, scored 1 / 3 / 5.

Levels 2 and 4 were considered and dropped: if the settings screen offers only
S/M/H, a seed score of 2 or 4 is one the household **cannot reproduce or edit
back to**, which makes the defaults quietly un-editable. Three levels still
give seven distinct point values (3, 5, 7, 9, 11, 13, 15) — ample resolution.
The 2 and 4 rows in the anchor tables below are shown for judgement when a
chore sits between levels; round to the nearer anchor.

```
points per completion = Effort + Aversion + Mental load     (range 3–15)
weekly load           = points × times logged that week
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

Aversion is the most personal dimension. **Decided: one shared score per chore
anyway**, agreed between you, for simplicity.

### Mental load (M) — planning, remembering, deciding, coordinating

| | Anchor |
|---|---|
| **1** (S) | Zero — the task is visible and the method obvious |
| **2** | Slight timing awareness |
| **3** (M) | Must be remembered on a schedule, with no external cue |
| **4** | Requires planning, decisions and tracking |
| **5** (L) | Carried continuously; involves other people or deadlines |

> **The cue test.** *Does the task announce itself?* Dirty dishes are visible —
> M1. Nobody can see that the robot needs new brushes — M5. This is an
> observable property of the task, not a feeling, which is what makes it
> possible for two people to agree on a score.

### What is deliberately NOT used as the weight

- **Time in minutes** — punishes efficiency, ignores aversion, and scores
  mental load at zero. Kept as displayed metadata only.
- **A single S/M/L "size"** — collapses three independent things into one, and
  mental load is what disappears.

---

## 2. The table

`t` = weekly target (an expectation for the recap, **not** a multiplier).
`pts` = points per completion.

### Kitchen & food

| Chore | E | A | M | pts | t |
|---|:-:|:-:|:-:|:-:|:-:|
| Put dishes in the dishwasher | 1 | 1 | 1 | **3** | 7 |
| Launch the dishwasher | 1 | 1 | 3 | **5** | 5 |
| Empty the dishwasher | 1 | 3 | 1 | **5** | 5 |
| Wipe counters & stovetop | 1 | 1 | 1 | **3** | 7 |
| Cook dinner | 3 | 1 | 3 | **7** | 5 |
| Meal planning & grocery list | 1 | 1 | 5 | **7** | 1 |
| Grocery shopping | 3 | 3 | 3 | **9** | 1 |
| Unpack & put away shopping | 1 | 3 | 1 | **5** | 1 |
| Clean fridge & sort leftovers | 1 | 3 | 3 | **7** | 0.5 |
| Deep clean oven | 3 | 5 | 1 | **9** | 0.25 |
| Vacuum the sofa | 1 | 1 | 3 | **5** | 0.5 |
| Vacuum the chairs | 1 | 1 | 3 | **5** | 0.5 |

### Bathroom

| Chore | E | A | M | pts | t |
|---|:-:|:-:|:-:|:-:|:-:|
| Clean toilet | 1 | 5 | 1 | **7** | 1 |
| Wipe sink & mirror | 1 | 1 | 1 | **3** | 1 |
| Notice & restock loo roll / soap | 1 | 1 | 5 | **7** | 1 |

### Laundry & clothes

| Chore | E | A | M | pts | t |
|---|:-:|:-:|:-:|:-:|:-:|
| Launch a laundry load | 1 | 1 | 3 | **5** | 3 |
| Unload & hang on the étendoir | 1 | 3 | 3 | **7** | 3 |
| Fold & put away | 3 | 3 | 1 | **7** | 3 |
| Put out the bed sheets for the cleaner | 1 | 1 | 3 | **5** | 0.5 |

### Floors & surfaces

| Chore | E | A | M | pts | t |
|---|:-:|:-:|:-:|:-:|:-:|
| Prepare the house for the robot | 1 | 3 | 3 | **7** | 3 |
| Launch the robot vacuum | 1 | 1 | 3 | **5** | 3 |
| Empty & clean the robot | 1 | 5 | 3 | **9** | 1 |
| Buy replacement parts for the robot | 1 | 1 | 5 | **7** | 0.1 |
| Tidy & declutter shared spaces | 1 | 3 | 3 | **7** | 5 |

### Bins & recycling

| Chore | E | A | M | pts | t |
|---|:-:|:-:|:-:|:-:|:-:|
| Track collection day & put the bins out | 1 | 3 | 5 | **9** | 1 |
| Bring the bins in from the box | 1 | 3 | 3 | **7** | 1 |
| Take the rubbish out to the bins | 1 | 3 | 3 | **7** | 2 |
| Take the cardboard out to the bins | 1 | 3 | 3 | **7** | 1 |
| Replace the bin bags | 1 | 3 | 1 | **5** | 0.5 |
| Clean the bin | 1 | 5 | 3 | **9** | 0.25 |

### Admin & mental load

| Chore | E | A | M | pts | t |
|---|:-:|:-:|:-:|:-:|:-:|
| Collect the post | 1 | 1 | 3 | **5** | 3 |
| Pay bills & manage budget | 1 | 3 | 5 | **9** | 1 |
| Work on investments | 3 | 1 | 5 | **9** | 1 |
| Manage the cleaner — payment & schedule | 1 | 3 | 5 | **9** | 0.5 |
| Book & track appointments | 1 | 3 | 5 | **9** | 1 |
| Birthdays, gifts & social calendar | 3 | 1 | 5 | **9** | 1 |
| Track household supplies running low | 1 | 1 | 5 | **7** | 1 |
| Insurance, renewals, paperwork | 1 | 5 | 5 | **11** | 0.25 |
| Coordinate repairs & tradespeople | 3 | 5 | 5 | **13** | 0.1 |
| Wedding logistics & coordination | 3 | 3 | 5 | **11** | 3 |

### Outdoor & occasional

| Chore | E | A | M | pts | t |
|---|:-:|:-:|:-:|:-:|:-:|
| Water plants | 1 | 1 | 3 | **5** | 3 |
| Mow lawn / garden tidy | 5 | 3 | 3 | **11** | 0.5 |
| Car maintenance, service, admin | 3 | 3 | 5 | **11** | 0.1 |
| Wash the car | 3 | 3 | 1 | **7** | 0.25 |
| Declutter / reorganise a room | 5 | 3 | 3 | **11** | 0.1 |

**43 chores.**

---

## 3. Removed in this revision

Deleted because a cleaner covers them, or because they were replaced by a more
granular version:

| Removed | Reason |
|---|---|
| Wash dishes / dishwasher | Split into put-in / launch / empty |
| Clean shower & bath, Clear drain | Cleaner |
| Wash & dry a load | Replaced by launch + étendoir (no dryer) |
| Ironing, Dry cleaning & repairs | Cleaner / not applicable |
| Change bed sheets | Replaced by "put out the sheets for the cleaner" |
| Mop, Dust, Clean windows | Cleaner |
| Tidy & declutter shared spaces | Removed on request — **see flag below** |
| Vacuum | Replaced by the robot chores |
| Rubbish out on collection day, Sort recycling | Replaced by granular bin chores |

---

## 4. What the revision changed

### Outsourcing cleaning removed effort, not mental load

Expected weekly load ≈ **438 points**, split by dimension:

| Dimension | Points | Share |
|---|:-:|:-:|
| Effort | 106 | 24% |
| Aversion | 140 | 32% |
| **Mental load** | **192** | **44%** |

**Mental load rose from ~35% to 44%, and is now by far the largest dimension —
almost double physical effort.** Bringing in a cleaner deleted eight physical
chores, but every admin task survived, and managing the cleaner (payment,
scheduling, prepping sheets) *added* new mental load.

This is the pattern worth knowing: **you can outsource effort, but the
noticing, remembering and coordinating stays with you.** A system scoring only
physical work would show this household getting dramatically lighter. It
didn't — it got proportionally more mental.

### Heaviest per completion vs. heaviest per week

| Heaviest per completion | pts | | Heaviest per week | wk |
|---|:-:|---|---|:-:|
| Coordinate repairs & tradespeople | 13 | | Cook dinner | 35 |
| Insurance, renewals, paperwork | 11 | | Wedding logistics | 33 |
| Wedding logistics | 11 | | Launch the dishwasher | 25 |
| Mow lawn / garden tidy | 11 | | Empty the dishwasher | 25 |
| Car maintenance, service, admin | 11 | | Put dishes in the dishwasher | 21 |

The two lists barely overlap. **The dishwasher cycle alone is 71 pts/week** —
more than double the heaviest single job in the house — purely because it
happens every day. Splitting it into three steps was the right call: it is the
household's largest single load and was previously hidden inside one row.

### The robot vacuum illustrates the model

"Buy replacement parts for the robot" scores **7 points on essentially zero
physical effort** — nobody sees the brushes wearing out, there's no cue, and
if it isn't tracked the robot degrades. Pure invisible work, correctly priced.

---

## 5. Flags & open questions

1. **⚠️ Tidying was deleted, and it was joint-second heaviest** (35 pts/wk).
   A cleaner *cleans* — she generally doesn't put your belongings away. If
   tidying still happens, deleting it removes one of the largest real loads
   from view, which is exactly the failure mode this app exists to prevent.
   Confirm: genuinely not happening, or invisible-but-real?
2. **⚠️ Bin-day tracking disappeared.** The old "rubbish out on collection
   day" scored 9 mostly on mental load — a hard deadline with no cue. The new
   bin chores are the physical act only. Does someone still have to remember
   collection day and get the bins to the street? If so it needs its own entry.
3. **Three readings to confirm** — "remove dish from dishwasher" read as
   *empty the dishwasher* (not "delete"); "remove and put the laundry on the
   étendoir" read as *unload and hang*; **"remove bins from the box"** read as
   *bring the bins in from their outdoor box* — least confident of the three.
4. **How often does the cleaner come?** Drives targets for the sheets and
   payment chores, and may remove more entries.
5. **Toilet, sink and counters** were kept — does the cleaner do these too?
6. **Garden and car were kept** ("Outdoor — perfect"), so confirming: you do
   have both?
