# Prompt for Codex — wire the founding story into the pilgrimage-roguelike pass

Your last pass (commit `1904d88`, "Pilgrimage roguelike pass") was good and stays as the
foundation — do not rework the journal system, board, combat, or procedural layout fix. This is
a narrative-continuity correction and enrichment pass only, targeting the new content you wrote
plus a doc update.

## Canon you didn't have

The base game (pre-your-pass) already establishes this story, spread across
`config/objects.ts` (Persius's note and scroll, the Salamander's letter), `config/weapons.ts`
(the Discos), and `app/sub-games/hermit-hollow/dialogue.ts`. Your new content invented a
conflicting detail and a misspelling. Full story bible:

> Within the Pyramid of the Last Redoubt, the last ten million souls of mankind shelter behind
> the Circle of the Earth Current. Among its aristocratic houses, **Christos** and **Persius** were raised as
> friends since boyhood. Both were promised, by their families, to **Helen** — but she is
> betrothed to Christos specifically, and a close friend to both of them in her own right.
>
> Persius spent his young manhood in the Redoubt's library, chasing a thread most scholars
> dismissed as legend: the **Tesseract**, an artifact wrought by the Salamander (one of the last
> Science-Wizards) as a catalyst to unmake the Night Land and return mankind to light. The ancient
> writings he found in the archive didn't just name it — they hinted the Salamander hid it, and
> hid the means to find it, somewhere beyond the Circle.
>
> Helen begged him not to go. He went anyway, alone, leaving Christos a scroll: *return to the
> Redoubt, do not follow, I go now in search of the Tesseract, I must.* Weeks later his trail was
> found leading out past the Circle. Christos took up his Discos and crossed the Circle himself —
> not from belief he'll succeed, but because he cannot leave his friend to that dark alone.
>
> His quest is Persius's quest continued: follow what Persius left on purpose (notes, a trail, a
> charging cache for the Discos) and what Persius never lived to find (the Salamander's Current-Loom
> network, the Hermit, the Deep Silo, and whatever waits at House of Silence).

## Required fixes (conflicts with existing canon)

1. **Rename "Myra" → "Helen" everywhere you introduced her.** Specifically:
   - `app/princess/index.tsx` — the `COVENANT` array's second beat: `marker: 'THE WORD OF MYRA'`
     → `'THE WORD OF HELEN'`, and update the surrounding prose to speak in Helen's voice.
   - `CODEX_RUN_SUMMARY.md` and `docs/CODEX_DESIGN_THESIS.md` — replace "Myra's warning" with
     "Helen's warning".
2. **Fix the spelling "Diskos" → "Discos"** in `modules/expeditionJournal.ts` (the objective text
   "The Diskos carries the deep current now..." and the Salamander discovery text "...the Diskos
   may be part of his unfinished design."). Every other file in the project (`config/weapons.ts`,
   `config/objects.ts`, `config/player.ts`, Persius's own note) spells it **Discos** — this is the
   established weapon name, not a variant.
3. **Stop explaining the Circle as "electric."** `app/princess/index.tsx`'s first covenant beat
   currently reads "Beyond its electric Circle the Night has waited..." — the Circle is powered
   by the **Earth Current**, a fictitious force that is never explained in-world and must stay
   that way. Don't substitute one unexplained-sounding label for another that secretly *is* an
   explanation ("electric" is a real-world mechanism). Say "the Circle" or "the Circle of the
   Earth Current" and leave it at that — no further elaboration of how or why it works.

## Enrichment (new beats to weave in, not replace)

4. **`app/princess/index.tsx`** — the covenant currently jumps from "the Last Redoubt" straight to
   Helen's warning without ever establishing who Christos and Persius are to each other, or that
   Helen is his betrothed. Extend the first beat ("WITHIN THE LAST REDOUBT") or add a beat between
   it and Helen's, to land: Christos and Persius as friends since boyhood, both aristocrats of the
   Pyramid, Persius's obsession with the archive and the Tesseract, and Helen's place as Christos's
   betrothed and a friend to them both. Keep the prose in the same restrained, King-James-adjacent
   register already used — don't over-explain; a few precise lines land harder than a paragraph.
5. **`modules/expeditionJournal.ts`**, the `'tesseract'` discovery entry — currently: "Persius
   followed references to a shape that is also a passage. The earliest tablet was left to be
   found." Update it to place the discovery specifically in the Redoubt's library/archive, per the
   bible above, so the player learns *where* Persius's obsession started, not just that it existed.
6. **`docs/GAMEPLAY_STORY_DESIGN.md`** — add a short "Cast & Setting" section near the top (above
   "Storyline 1") capturing the story bible above in your own words, so it's the single
   authoritative reference alongside the existing Earth-Current thread material already in that
   doc. Don't restate or contradict anything already documented there (Salamander, Current-Loom,
   Silent Ones, House of Silence, Discos upgrade) — this section is the missing "who are these
   people and why" that the rest of the doc currently assumes.

## What NOT to touch

Board rendering, movement, combat, save schema, the procedural-layout regeneration fix, and the
journal's objective-derivation logic (`getObjective`/`deriveExpeditionJournal` structure) are all
out of scope — this pass only touches prose/copy in the files listed above plus the one doc
addition. Keep your existing "left deliberately alone" list from `CODEX_RUN_SUMMARY.md` intact.

House of Silence's actual ending sequence (what happens when Christos reaches Persius there) is
deliberately not specified here — that content doesn't exist yet and is being designed separately.
Nothing in this prompt should imply or foreshadow how that resolves; keep any House of Silence
references forward-pointing and unrevealing, as the existing text already does.
