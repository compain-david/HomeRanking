# Handoff: HomeRanking "Bloom" Redesign (V3)

## Overview
A full visual + UX redesign of HomeRanking (household load tracker for Alix & David) in a "liquid glass" dark aesthetic, plus four agreed feature additions: per-person "usuals" surface, chore search, tappable dimension breakdowns, a week-close ceremony with recap, an upgraded "Since the beginning" screen (dimension breakdown, shared milestones, recap shelf), and a safer bottom-sheet chore editor.

Target codebase: `compain-david/HomeRanking`, branch `claude/chore-scoring-system-1p6bpg` (React 18 + Vite + TS, `src/App.tsx`, `src/Settings.tsx`, `src/AllTime.tsx`, `src/styles.css`, Supabase sync via `useSync`/`useChores`).

## About the Design Files
`HomeRanking V3 Bloom.dc.html` is a **design reference created in HTML** (open it in a browser with `support.js` alongside; it is a working interactive prototype). It is NOT production code. The task is to **recreate this design inside the existing React app**, keeping all existing logic (`useSync`, `useChores`, `useCountUp`, localStorage persistence, offline-first behavior, `prefers-reduced-motion`) and replacing the presentation layer. All state logic in the prototype mirrors the real app's semantics on purpose.

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, copy and animations are final and should be recreated pixel-perfectly. Extend the existing token system in `styles.css` rather than hard-coding.

## Non-negotiable product rules (from docs/SPEC.md — the redesign preserves them)
1. Colour means a person: Alix teal, David violet — the ONLY saturated hues. Dimensions are told apart by tone/opacity of the active person's colour.
2. The mental-load comparison is the payload; it lives INSIDE the hero panel.
3. Balance first, numbers second. No mechanic that makes someone feel bad.
4. Taps never wait for the network. All targets ≥ 44×44px. WCAG AA in both themes.
5. This handoff styles the dark theme; derive the light theme from the same structure using the existing light tokens (`--alix:#16706a`, `--david:#5b4bc4`, etc.) and re-verify AA.

## Design Tokens (dark theme — extend `styles.css`)
Existing tokens reused: `--paper #0e1211` (prototype phone ground `#0b0f0e`), `--ink #e6eae6`, `--muted #a7b1ab`, `--faint #869089`, `--alix #3fa39b`, `--david #8b7df0`, `--tilt #d69a4c`, radii 10/18/28 (new: 22px rows, 32px hero, 999px pills), easing `cubic-bezier(0.16,1,0.3,1)` (entrances) and existing spring for the beam.

New tokens:
- Person light tints (text on tinted fills): `--alix-light #9fe0d9`, `--david-light #c4baf7`; dim labels `#7fd0c8` (Alix) / `#b3a8f5` (David).
- Glass surfaces: base `rgba(255,255,255,.03–.05)` + `backdrop-filter: blur(8–18px)` + `box-shadow: inset 0 1px 1px rgba(255,255,255,.10–.15)`.
- Glass gradient border (hero panel, header pill, slider only): a `::before` with `padding:1.4px`, `background:linear-gradient(180deg, rgba(255,255,255,.5), rgba(255,255,255,.18) 22%, transparent 42%, transparent 62%, rgba(255,255,255,.18) 82%, rgba(255,255,255,.5))`, `-webkit-mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); mask-composite:exclude; -webkit-mask-composite:xor; pointer-events:none`.
- Ground washes (shift with active tab): `radial-gradient(420px 360px at 18% 6%, rgba(63,163,155,.32|.14), transparent 68%)` + mirrored violet at 92% 30% (.32 when David active) + `radial-gradient(500px 460px at 50% 100%, rgba(activePerson,.10), transparent 70%)`.

### Typography (existing families, new scale)
- Display: Familjen Grotesk — hero numbers 54px/600/-.04em (all-time 46px, recap 44px), screen headings 30–32px/400/-.02em, section names 14–15px/600.
- Serif accent (NEW font): **Instrument Serif italic 400** — the italic word in headings (34px), verdict chips ("in balance"), micro-notes ("mostly Alix"), the kind closing line (16px), points line in editor. Load weights 400 + italic only.
- Body: Public Sans — rows 14–15px/400–500, verdicts 12–12.5px, descriptions 11.5–12.5px at 50–65% white.
- Data: DM Mono — small-caps labels 10–11px with `.12–.14em` tracking (`WEEK 31 · SYNCED`, `ALIX`, `YOUR USUALS`), counters 15–16px/500, meta 11px. All numeric spans `white-space:nowrap`.

## Screens

### 1. This week
- **Header row** (flex, gap 8): glass pill left (6px glowing dot in active person colour + `WEEK 31 · SYNCED`), then two 44px glass circle buttons `∑` (all-time) and `⚙` (settings); active view's button gets an accent tint `rgba(person,.25)`.
- **Heading**: "Alix & David" (13px/55%) over "Who carries *the week?*" — the serif italic carries `text-shadow: 0 0 18px rgba(person,.45)`.
- **Person tabs**: pill segmented control (container `rgba(255,255,255,.04)`, padding 5px, radius 999). Active tab: `rgba(person,.18)` fill, `rgba(person,.5)` 1px border, light-tint text; inactive: transparent, `#869089`. Each shows name + `NN pts`. Switching tabs re-colours the ENTIRE ui (washes, accents, steppers) — keep the existing `--who` CSS-variable mechanism.
- **Glass hero panel** (radius 32, blur 18, gradient border): the two totals (54px) with the inactive person at 55% opacity; centre italic chip ("in balance" / "Alix +12" / "no data yet"); the beam (two 6px arms growing from a centre 11px white dot, gradient fading outward, glow `0 0 14px rgba(person,.5)`, container rotated by `clamp(-1.4deg, (davidTotal-alixTotal)*.05, 1.4deg)`, arms `width: total/heaviest*100%`, transitions .5s expo-out); verdict sentence (existing copy logic); then the **three dimension pills** (EFFORT / AVERSION / MENTAL as buttons, flex 1/1/1.15): label 10px mono, % of combined household points 20px, italic note ("even"/"mostly Alix"/"more David" — ≥60% share = "mostly"). Mental pill: when lopsided (≥60%), tinted `rgba(carrierPerson,.16)` + glow. **Tapping a pill** expands a dark inset panel (`rgba(0,0,0,.22)`, radius 18) listing the top-3 chores driving that dimension by `(countA+countD)×dimensionValue`, each row "name — Alix ×n · David ×n". Tap again to collapse. Below: the insight sentence in italic serif, centred (existing insight copy logic).
- **Search**: magnifier glyph + borderless input ("Find a chore…", 1px bottom hairline `rgba(255,255,255,.12)`), ✕ clear button when non-empty. When query non-empty, usuals+categories are replaced by a flat filtered list (max 10) of standard chore rows.
- **Usuals** ("ALIX'S USUALS" / "DAVID'S USUALS" — per person, computed per tab): top 4 (configurable) of the active person's chores sorted by this week's count desc, then target desc. Rows radius 22, glass, name 15px/500, meta `"7 pts · ×3 this week"`; stepper: 44px − (subtle `rgba(255,255,255,.05)` circle), count in person light tint, 44px + (filled `rgba(person,.2)` + glow).
- **Categories**: glass sections radius 24; header row 52px: emoji, name (15px/600), `logged / target` in person tint, rotating ▾ caret. Body rows radius 16; logged rows tinted `rgba(person,.09)`; each row: name 14px, three **tick bars** (6px wide, heights `3 + value×1.4`px, person colour full opacity — replacing the old 4px near-invisible ticks), meta `"7 pts · target 5"`, and − n + stepper (44px, + is a 1px person-border circle). Whole left side of the row is the +1 tap target (existing `.row-hit` pattern).
- **Slide to close the week**: 56px glass pill track with gradient border; 44px white draggable thumb (→ glyph); label "Slide to close the week"; three chevrons fading in at right. Pointer-drag: snaps back below 85% of track, completes past it, then opens the recap after 350ms. Respect reduced-motion (offer a tap-and-hold or plain button fallback).

### 2. Week-close recap (overlay — the ceremony)
Full-screen scrim `rgba(5,8,7,.72)` + blur 14; glass card (radius 36, gradient border) entering with a pop (translateY 24px → -3px overshoot → 0, .6s expo-out). Contents in order:
1. `WEEK 31 · CLOSED` (mono caps) / "The week, *seen.*" (28px + serif italic)
2. Both totals (44px) with the italic chip between
3. Static gradient beam
4. The mental-load insight sentence
5. **CHORE OF THE WEEK** card: highest `count×points` across both people — name + `"×9 between you · 63 pts of the week"`
6. **Milestone** card: one achieved shared milestone (✓ in a white circle) + caption "a milestone you reached together"
7. **Kind line** (16px serif italic, centred) — e.g. "The noticing got noticed. That is the whole point of this." (mental-lopsided) / "A level week — carried together, seen together." (level) / "Every point here is work the house never says thank you for. Consider it said." (default)
8. Buttons: outlined "Since the beginning" + filled white "Done". In production, closing should archive the week (existing week-key rollover) — the recap becomes that week's card on the all-time screen. Use `useCountUp` on the two totals when the card opens.

### 3. Since the beginning
- Heading "Every week, *added up.*"; glass hero with all-time totals (46px) + italic chip ("even, all time" / "David ahead").
- **Dimension composition** (THE new payload at this timescale): one bar per person, width scaled to the heavier person's all-time total, split E/A/M as person colour at opacity 1 / .55 / .28, with a mono label `"E 26% · A 28% · M 46%"`. Legend "■ effort ■ aversion ■ mental". Below, the all-time insight sentence — when totals are even but one person's mental-load share ≥58%, say so.
- **TOGETHER — MILESTONES** (shared, no losers): glass rows with a badge circle (✓ white-filled when achieved; dimmed at 45% opacity + "·" when locked). Launch set: "500 points as a household" (with running total), "N balanced weeks in a row" (totals within 5%), "Mental load seen", "8 weeks logged together" (progress caption "4 of 8 so far").
- **WEEK BY WEEK** recap shelf: one card per closed week — label ("13 – 19 Jul"), total pts, a split bar (teal|violet) whose **total width is scaled to the heaviest week** (absolute comparison, not 100%-stacked), and an italic one-line verdict ("an even week" / "Alix carried 59%").
- **WHO DOES WHAT**: hairline-separated rows — chore name, 52px split bar, `alixCount / davidCount` in person colours (existing `perChore` tally data).

### 4. Chores & scores (settings)
- Heading "What things *are worth.*" + existing explanatory copy.
- Category sections (emoji + name over a hairline). Each chore row (radius 18, glass): name; a **weight bar** (64px track, fill = `points/15`, person colour) so heavy chores look heavy; meta `"9 pts · Weekly"` — **frequency is ALWAYS the label** (Daily, 5×/wk, 3×/wk, 2×/wk, Weekly, 2 wks, Monthly, Rarely), never raw 0.5/0.1; a 34×20 switch (person colour when on) inside a 44px target. Hidden chores at 40% opacity. Tapping the row opens the editor.
- **Editor = bottom sheet** (not inline): slides up (same pop animation), grabber bar, `rgba(23,28,26,.92)` + blur 20, radius 36 top. Contents: name input (48px, glass); three dials — Effort ("physical drain"), Aversion ("how much you'd pay to avoid it"), Mental load ("does it announce itself?") — each S/M/H segmented (44px, selected = `rgba(person,.25)` fill + `.6` border + light-tint text) mapping to 1/3/5; **"Advanced — how often (Weekly)" collapsed by default** → 4-col grid of the 8 frequency labels + the caption "A target, never a judgement — it only feeds the progress counters and the weekly recap."; footer: "*9 points each time*" (serif italic, person tint) + **two-step Delete** ("Delete" → amber "Really delete?" using `--tilt`) + white "Done". Saves stay live-on-change (existing behavior) — safety comes from the two-step delete plus the **Undo snackbar**: after delete, a floating pill "Deleted 'X'" with Undo (restores chore) and ✕; auto-dismiss ~6s in production.

## Interactions & Motion summary
- Entrances: staged fade-up (16px, .5s expo-out, delays 50–500ms) once per screen load — keep the app's single-entrance rule.
- Beam arm widths, tab colours, wash colours, switch knobs: .2–.5s transitions.
- Recap/editor: pop-in (overshoot) .45–.6s.
- Everything gated behind `prefers-reduced-motion`.
- Suggested (not in prototype): +1 pulse flying to the total; long-press + for ×2/×3 catch-up logging.

## State Management (maps to existing code)
- `who` (tab) — existing. `q` (search string) — new. `dim` ('e'|'a'|'m'|null, expanded pill) — new. `open` (category accordions) — existing. `recapOpen` — new; triggered by slider completion; on Done, archive week. `editing` chore id + `advOpen` + `confirmDel` + `deleted` (undo buffer) — new in Settings. Counts/chores/sync/history — all existing hooks unchanged.

## Assets
None. Fonts from Google Fonts: Familjen Grotesk, Public Sans, DM Mono (existing) + **Instrument Serif (400, 400 italic)** — new; consider self-hosting all four for full offline (known gap in SPEC).

## Files in this bundle
- `HomeRanking V3 Bloom.dc.html` — the interactive prototype (all 4 screens + recap + editor + undo). Open in a browser next to `support.js`.
- `support.js` — prototype runtime (reference only, do not ship).
