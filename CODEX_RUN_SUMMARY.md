# Codex Run Summary

## Point of view

Nightland should be a **pilgrimage roguelike**: a single long expedition from the Last Redoubt
into a hostile world whose rules must be learned. Its procedural board supplies the variable,
dangerous journey; its RPG progression comes from a few transformative abilities and pieces of
knowledge; its Myst-like encounters are authored places that teach a shared symbolic and
mechanical language.

This is deliberately not a loot treadmill or a collection of puzzle minigames. Walking is a
meaningful verb because every step advances the horrors. Death erases the current expedition.
Waypoint saves are memories wrested from the dark, allowing severe consequences without making
every solved revelation disposable. The player should usually understand their present purpose
and the cost of an action even when the larger world remains mysterious.

The fuller design position is recorded in `docs/CODEX_DESIGN_THESIS.md`, which was written before
implementation.

## What changed and why

### A coherent expedition journal

- Added `components/ExpeditionJournal.tsx`, an in-game, diegetic “Book of the Expedition.”
- Added `modules/expeditionJournal.ts`, a pure state-derived journal model.
- The compact board tab always shows the present purpose without obscuring play. The full journal
  records current condition, distance, kills, learned relationships, and the next narrative goal.
- Objectives advance through the first tablet, Hermit, Salamander, five Current Looms, rune
  knowledge, Deep Silo, and the continuing search for Persius.
- Entries reveal only information already earned in the current state. They connect encounters
  without giving away puzzle solutions.
- Opening the journal blocks board input, so consulting it cannot accidentally spend a turn.
- Added focused tests covering a fresh run, learned discoveries, Loom progress, and critical
  health.

This is the connective tissue the existing game most needed: its already substantial combat,
procedural travel, powers, and puzzles now read as parts of one journey.

### A stronger beginning

- Reworked the title screen into a clear Night Land presentation with a restrained palette,
  stronger hierarchy, and explicit expedition/waypoint language.
- Replaced the single wall of intro text with a three-beat covenant scene: the Last Redoubt, Helen's
  warning, and the rules of the expedition.
- The final beat teaches the first objective, the step/turn relationship, and death/waypoint
  semantics before the player enters the board.

This establishes motive, tone, and basic rules without a tutorial overlay or lore dump.

### A meaningful end to a run

- Reworked the death screen as an expedition report.
- It now clearly states the killer, distance, kills, what was lost, and that prior waypoint
  memories remain.
- The return action is framed as going back to the Last Redoubt rather than immediately promising
  another generic attempt.

### Reliable procedural starts

- Fixed a pre-existing stochastic startup failure found during the full test run.
- Some otherwise valid generated trails had branches too short or crowded to place both scattered
  Current Looms. That caused new-game state creation to throw.
- The initializer now treats an unplaceable generated layout as a rejected run seed and regenerates
  the complete expedition within a bounded 12-attempt budget.

This preserves all placement constraints while preventing one unlucky procedural result from
making the game unplayable.

## What I deliberately left alone

- **Board rendering, movement, and combat:** these are large, functioning systems with regression
  coverage. Replacing them would have risked the playable vertical slice for little immediate
  thematic gain.
- **Existing encounter interiors:** the word grids, Rune Obelisk, Current Loom, Aero-Wreckage,
  Jaunt Cave, Hermit Hollow, and Deep Silo already provide the project's strongest authored
  material. This pass connects them instead of rewriting them.
- **Save schema:** the journal is derived from existing state, so this improvement does not
  invalidate current saves or add migration burden.
- **Permanent metaprogression:** waypoint memories already provide a thematically appropriate
  compromise between full permadeath and ordinary saves. Adding currencies or a skill tree would
  weaken the knowledge-as-progression premise until the run structure is more fully playtested.
- **New art and audio:** the repository already has a cohesive set of painted backgrounds and a
  strong ambient track. UI composition and prose had higher leverage in this bounded pass.
- **The unfinished endgame:** the Earth-Current arc currently points toward content beyond Deep
  Silo. Faking a final victory screen would make the world feel smaller and contradict the
  existing story plan.

## What I would do next

1. Add a House of Silence vertical slice with one Silent One that is visibly invulnerable until
   the Discos carries the amplified Earth-Current.
2. Make puzzle knowledge reusable on the board: rune-marked trail forks, Loom pulse patterns, and
   environmental clues whose interpretation changes after the Obelisk.
3. Add a small threat-forecast system. Nearby monster motion should be inferable from sound or
   board signs so difficult deaths feel consistent rather than random.
4. Give branch travel sharper choices: safe but long routes, Current-distorted shortcuts, and
   detours whose rewards are knowledge or survival tools rather than generic loot.
5. Add one more repeatable Myst-like encounter shape based on spatial observation instead of word
   entry, then distribute variants through the procedural manifest.
6. Playtest run length, pre-Hermit difficulty, potion density, and waypoint spacing on a physical
   phone. Tune only after observing where players stop reading the board and begin tapping
   mechanically.
7. Add component interaction tests for the journal modal and the three-stage covenant intro.

## How to run and play

Requirements: a supported Node.js installation and pnpm 10.

```bash
pnpm install --frozen-lockfile
pnpm start
```

From Expo's terminal UI, press `w` for web, `a` for Android, or `i` for iOS. Direct commands are:

```bash
pnpm web
pnpm android
pnpm ios
```

Choose **Begin an Expedition**, read through the three covenant panels, and cross the Circle. On
the board:

- tap away from Christos to take one step toward that point;
- hold on empty ground to continue walking;
- hold an object or creature to inspect it;
- use the central lower button to wait or attack;
- tap **Present Purpose** at the upper left to open the expedition journal;
- follow the green footsteps first, and stand on encounter entrances before inspecting them;
- remember that walking and waiting advance the hostile world.

## Verification

Run on 2026-09-15:

```bash
pnpm typecheck
pnpm lint
pnpm exec jest app/__tests__/SplashScreen.test.tsx modules/__tests__/expeditionJournal.test.ts --runInBand --no-watchman
pnpm exec jest modules/__tests__/gameboardLayout.test.ts modules/__tests__/expeditionJournal.test.ts --runInBand --watchman=false
```

Results:

- TypeScript: pass.
- ESLint: pass with 31 existing warnings and no errors.
- New journal/navigation tests: 4/4 pass.
- Layout and journal suites after the generator repair: 74/74 pass.
- A full suite run before the repair passed 611/612 tests and exposed the one stochastic layout
  failure. The formerly failing suite passes after the repair.

Jest must be run with `--watchman=false` in this environment because the system Watchman state
directory is read-only.

## Repository/commit note

The requested incremental commits could not be created because this workspace exposes `.git` as
read-only. Git fails while creating `.git/index.lock`; project files themselves remain writable.
The intended commit sequence was:

1. `docs: define the pilgrimage roguelike vision`
2. `feat: add the expedition journal and dynamic objectives`
3. `feat: reframe the expedition opening and death loop`
4. `fix: regenerate unplayable procedural layouts`
5. `docs: summarize the codex gameplay pass`

No remote exists or was contacted, and no work outside this standalone fork was changed.
