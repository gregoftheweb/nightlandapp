# Prompt 1: Rough map border, cliff collision, and directional cliff art

**Status:** Draft implementation prompt. Documentation only; implementation has not started.

## Task

Use the supplied Night Land map as the visual reference to replace the current square cliff border with a rough, irregular cliff outline. Focus only on the outer boundary, the cliff artwork needed to draw it, and collision that prevents the player from walking through it.

Reference: [Night Land map](assets/night-land-map-reference.png). This image is also intended to be available to the player as a help map in a later task, so preserve its recognizable overall geography. The red annotation boxes identify landmarks; they are not part of the terrain or boundary.

## Border shape

- Follow the broad silhouette of the land shown in the reference: an uneven northern edge, an indented western edge, a curved southern edge, and an irregular eastern edge.
- Produce a recognizable rough outline rather than tracing every small notch. Adapt the reference to the existing tile grid without stretching it into a square silhouette.
- Keep the existing rectangular grid as the underlying coordinate space unless implementation reveals a concrete reason to change it. The playable land occupies an irregular area inside that grid.
- Use one authored boundary definition to determine both cliff placement and playable-area collision, so the visible edge and blocked cells agree.
- Keep the interior usable and connected. Do not add interior terrain regions or landmarks in this task.

## Cliff artwork

- Reuse the existing cliff art where it fits and create additional pieces for missing directions and joins.
- Cover north-, south-, east-, and west-facing edges, diagonal or stepped transitions, and both inward and outward corners as needed by the rough outline.
- Match the existing game's cliff style, scale, palette, lighting, and transparent edges. Rotate or mirror existing pieces only where the result remains visually convincing.
- Make joins continuous, with no obvious gaps, overlapping seams, or directional lighting errors. Large cliff faces must not obscure cells that the player can actually occupy.
- Produce only the pieces needed for this border; a comprehensive terrain art library is outside scope.

## Player collision

- Treat the cliff boundary and the space outside the enclosed land as impassable.
- Prevent every existing player movement path from crossing the cliffs, including repeated or held movement and any movement ability that could otherwise bypass the boundary.
- Check the player's occupied footprint, not just a single anchor coordinate. For movement that covers multiple cells, prevent crossing the boundary even if the destination appears valid.
- Reject an invalid move cleanly without placing the player in a cliff or outside the map. Use the game's existing blocked-movement behavior.
- Keep walkable interior cells accessible. Decorative cliff pixels must not silently introduce additional collision.
- Ensure the existing spawn and required playable content remain inside accessible land. If the rough outline conflicts with their current positions, flag the conflict and adjust the outline for this pass rather than relocating major content.

## Scope limits

Do not move the Last Redoubt, change the player spawn, relocate or regenerate the Perseus/Persius trail, place the House of Silence or Watchers, add named terrain regions, redesign monster pathfinding, or build the player-help map interface. These are separate tasks. Record any dependencies discovered while implementing the border.

## Acceptance criteria

1. The outer cliff outline broadly resembles the supplied map and no longer reads as a perfect square.
2. Cliff pieces cover the required directions and corners with continuous, coherent joins.
3. The player cannot enter, cross, or bypass the cliff boundary or occupy exterior cells through any existing movement mode.
4. Walkable land remains connected, and the current spawn and required playable content remain accessible.
5. Border appearance and collision agree at straight edges, inward corners, outward corners, and diagonal or stepped transitions.
6. Verify movement along representative sections of every side and corner type, including held movement and applicable movement abilities. Check border rendering at the existing zoom levels.
7. Report the changed files, new cliff assets, validation performed, and any remaining rough edges.

Exact tracing, final visual polish, and new gameplay geography are deferred. This pass establishes a usable rough boundary.
