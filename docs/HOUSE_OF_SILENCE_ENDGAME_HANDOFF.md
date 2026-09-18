# House of Silence — Endgame Sequence Handoff

**Status:** first pass, higher-level handoff — narrative and structural shape, not a build spec.
**Scope note:** this sits *above* the two docs already written for this arc and doesn't repeat
their detail — read them alongside this one:

- `docs/HOUSE_OF_SILENCE_STORY_DESIGN.md` — the prose of the approach, Mary's pool, ends at the
  threshold.
- `docs/MARYS_GRACE_MECHANIC_DESIGN.md` — the grant-side mechanic for Grace, and a first sketch of
  the heartbeat-tap survival loop.
- [[project_nightland_story_bible]] (memory) — the full decision log this is drawn from, including
  things settled in conversation that aren't written anywhere else yet.

This doc's job is to connect those pieces into one arc — pool, threshold, interior, Persius, the
Tesseract, the Silent Ones, the choice, the end — and name what's still genuinely undecided rather
than silently filling every gap.

## 1. The arc, in one pass

Christos leaves the pool renewed — Discos charged, Hide available, Grace granted — and climbs to
the door that has never closed. Crossing it is where the game itself changes shape: first-person,
scripted, Dragon's-Lair-cadence rather than the board he's walked the whole game. Inside, the
House's own hazard (the psychic/spiritual assault the source material describes) runs as an
ambient heartbeat-tap loop the whole time he's inside — Grace is what makes that loop survivable
at all, not just easier. Woven through that ambient loop are direct encounters with Silent Ones,
handled differently depending on whether he avoids, hides from, or is forced to fight one. At the
end of the passage: a sanctum, Persius's body — dead in every visible way, but not beyond the
Tesseract's reach — laid before a pedestal bearing the Tesseract itself. The game does not offer
Christos a choice between saving Persius and saving mankind. It only ever gives him the means to
reach his friend. He uses the Tesseract. Persius wakes. The Night Land does not end. "Man is not
forsaken" — true when she said it — closes over a promise Christos's own hand just broke.

## 2. Crossing the threshold — the genre shift itself

The door is always open in the source material; nothing to unlock or solve there. The shift should
be presentational, not mechanical: the board view simply doesn't return once he steps through. This
is the single clearest "something has changed" signal available and it costs very little — no new
system, just not going back to the map screen.

## 3. The interior — three threads running together

**Thread A — the ambient hazard (ongoing).** The heartbeat-tap loop from
`MARYS_GRACE_MECHANIC_DESIGN.md` §5 runs continuously while Christos is inside, not just during set
encounters. This is the House itself, not the Silent Ones specifically — it's what killed the
young men in the book who never came out, and what struck the Maid down from a distance. Grace is
the gate condition for entering at all; the tap loop is what keeps him alive once in.

**Thread B — the Silent Ones (encountered, not ambient).** The source material is explicit that
they're "unaggressive unless approached" and kill by freezing the heart on contact, not at range —
which maps cleanly onto three different player responses without inventing a new combat system:

- **Avoid** — route around them. No mechanic needed beyond level geometry/scripted timing.
- **Hide** — the existing Hermit-granted ability, reused here for its original purpose (concealment
  from the dark) rather than a new one.
- **Fight** — if avoidance fails, this is where the charged Discos pays off the entire Current-Loom
  → Deep Silo chain: the existing melee combat system, not a new one, with Silent Ones simply
  flagged as damageable only by a charged weapon (a property the combat system should already be
  able to express, since "indestructible against normal weapons" was decided back when Deep Silo's
  charge mechanic was designed).

Keeping combat on the existing system (rather than building fighting into the new first-person
mode) is a deliberate cost call, in the same spirit as rejecting true 3D FPS earlier this session —
spend the new-tech budget on the ambient dread (Thread A), not on rebuilding combat.

**Thread C — the path itself.** Scripted, Dragon's-Lair-style beats connecting the encounters —
short, authored, not proceduraly generated the way the outer board is. This is a single
playthrough's worth of content, not a repeatable shape.

## 4. The sanctum

Persius, and the Tesseract on its pedestal. A few things worth being deliberate about in how this
is staged, since it's the emotional peak of the whole game:

- **Persius reads as dead, but isn't, in the specific sense that matters:** whatever state he's
  in, it has to be something the Tesseract's power can undo, or the ending doesn't work. "Bound,"
  "frozen," "deadlike" were all on the table earlier in this design pass — this scene resolves that
  toward **apparent death that is not final**, which fits House of Silence's own established
  nature (it "destroys human spirits," per the source-material research — that's closer to a
  captured/suspended state than ordinary death) and gives the Tesseract something real to do rather
  than performing a resurrection with no groundwork.
- **The pedestal** stages the Tesseract as something found, not fought for — consistent with
  everything the Salamander's letter already establishes (he hid it, didn't guard it with a
  monster). The danger between Christos and the Tesseract is the House and the Silent Ones, not a
  boss guarding the object itself.

## 5. The choice — and why it isn't one

Already decided, and worth restating precisely because it's easy to accidentally soften in
implementation: **there is no menu, no branch, no prompt asking whether to save Persius or
attempt something else with the Tesseract.** The game's only actionable input at this moment is
whatever brings Christos to Persius — the interaction design itself should embody the "Kirk
choice," not present it as a dialogue option the player picks. If the interface ever offers a
literal button labeled "use Tesseract to save mankind instead," the scene has failed at what it's
for. Kirk didn't deliberate a trade-off table before going back for Spock; the game should give
Christos the same lack of alternative. This is the mechanical expression of "the one outweighs the
many" — it's not a choice the player makes, it's who Christos already is by the time he gets here.

## 6. The ending

Persius wakes. The Tesseract's power is spent — on this, not on what it was made for. The Night
Land continues. Whatever ending text or screen closes this out should let "Man is not forsaken"
land as a broken promise the player already heard spoken in good faith at the pool, not a new line
introduced here for irony's sake. A direct callback (the exact words, not a paraphrase) is probably
the strongest version of this, but the specific staging is open — see §7.

## 7. Explicitly open — not decided in this doc

- **Exact ending presentation:** does the game end here entirely, roll into some further epilogue,
  or return to a changed Redoubt/world state? Nothing in this session settled that.
- **Whether "Man is not forsaken" is literally re-spoken/re-shown at the end**, or left as
  something only the player who remembers the pool scene carries forward unprompted. Both are
  valid; leaning toward the callback being explicit (per §6) but not committed.
- **Number and placement of Silent One encounters**, and how much of the interior is combat vs.
  pure ambient-hazard traversal — a balance/pacing question, not a design-philosophy one, better
  answered once Thread A's tap loop is actually prototyped and its difficulty is known.
- **Persius's playable/narrative role after waking**, if any — does the game continue at all past
  this point, or is this the final screen?
- Everything in `MARYS_GRACE_MECHANIC_DESIGN.md` §7 (ability naming, UI treatment, exact tap-loop
  numbers) still applies and isn't re-opened or re-settled here.
