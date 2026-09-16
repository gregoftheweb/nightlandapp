# Design Thesis: A Pilgrimage Through the Night

Nightland should be a **pilgrimage roguelike**: one long, dangerous journey from the Last
Redoubt into a world that is older, larger, and more hostile than the player can understand.
The board is not a level-select map. It is distance made frightening. Every step spends safety,
moves the horrors, and carries Christos farther from the only human light left in the world.

The genres serve that journey in different ways:

- **Roguelike:** each expedition rearranges the trail and its encounters; movement advances a
  hostile world; death destroys the current expedition. Waypoint saves are memories wrested
  from the dark, not ordinary save slots, so failure is severe without demanding the player
  repeat every solved revelation.
- **RPG:** growth comes from a few transformative capabilities—Hide, Jaunt, the rune cipher,
  and a strengthened Diskos—rather than a shower of interchangeable gear. The most important
  character statistic is what Christos has learned and what risks the player is now willing to
  take.
- **Myst-like puzzle adventure:** mechanisms and texts are physical places in the world. Puzzle
  solutions should teach a reusable symbolic language and reveal causal relationships between
  distant machines. Observation and inference should change how the player reads the board,
  not merely award a key.

## The core loop

1. Leave the Redoubt under a clear covenant: find Persius, follow the Earth-Current, return if
   return is still possible.
2. Travel a procedurally composed trail while balancing speed, wounds, monsters, and detours.
3. Discover authored places whose puzzles reveal both lore and practical knowledge.
4. Acquire a small number of abilities that materially change movement and survival.
5. Reach a waypoint or die. A waypoint preserves hard-won knowledge; death ends the present run.
6. On a later expedition, use remembered relationships to travel farther and make different
   choices.

## Experience principles

- **Legible dread.** The player should understand the immediate objective and the cost of an
  action even when the world itself remains mysterious.
- **Knowledge is progression.** A journal records clues, machine states, and discoveries without
  solving puzzles for the player.
- **Few, consequential verbs.** Walk, wait, fight, hide, jaunt, inspect, and manipulate. Every new
  verb must change how existing spaces are read.
- **Authored mystery in a variable journey.** Encounter interiors are carefully authored; their
  positions and the dangers between them vary by expedition.
- **The Night is not fair, but it is consistent.** Death can be frequent. It should follow rules
  the player can gradually perceive rather than arbitrary punishment.
- **Restraint over feature count.** Sound, typography, prose, negative space, and persistent
  unanswered questions do more for cosmic horror than larger inventories or denser HUDs.

## This pass

The existing project already has strong raw material: procedural trail placement, turn-based
movement, melee and ranged combat, hostile terrain, several substantial encounter puzzles,
waypoint persistence, and rare movement powers. Its largest gap is cohesion. The player is not
shown how these systems form a run, what the expedition is presently trying to accomplish, or
how discoveries relate to one another.

This pass therefore prioritizes a playable connective layer instead of replacing stable systems:

- establish the covenant and stakes before a new expedition;
- add a diegetic expedition journal that derives objectives, discoveries, and run condition from
  real game state;
- surface concise guidance without turning the board into a checklist;
- make death and memory semantics explicit;
- improve the first-session visual and narrative hierarchy;
- retain the board, combat, procedural trail, and authored puzzles as the game's foundation.

The test for every addition is simple: does it make the player feel that they are learning how to
survive one coherent, impossible journey through the Night?
