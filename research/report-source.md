# MTG Arena Battlefield Research — Source Report

Audience: MTG Table Engine product/design work  
Date: 2026-09-03  
Scope: Arena's live-match interaction model, translated for a physical-card companion supporting 2–8 players. Store, collection, economy, and deck-builder UX are excluded.

## Executive answer

Arena's battlefield feels manageable because it treats attention as a rules-controlled state. It advances through routine no-action moments, presents a small set of currently legal actions, expands zones and cards only on demand, and interrupts the flow for choices that cannot be inferred. MTG Table Engine should adopt this attention choreography, but it should not attempt Arena's full digital battlefield or infer decisions from private physical cards.

The target should be a four-state HUD: **Glance**, **Attention**, **Act**, and **Inspect**. In Glance state the phone stays awake and shows only public essentials. Attention state uses a restrained visual/haptic cue for the one player who must respond. Act state exposes the smallest relevant control set. Inspect state is optional and user-invoked.

## Evidence

- Wizards' basic rules divide turns into beginning, first main, combat, second main, and ending phases; combat itself proceeds through attacker, blocker, and damage decisions. Source: *How to Play*, Wizards of the Coast, accessed 2026-09-03. https://magic.wizards.com/en/how-to-play
- Wizards explains that players technically receive priority many times, but most priority passes are no-ops and normal tabletop games do not verbalize each one. Source: *Attacking and Blocking*, Wizards of the Coast, 2015-07-27. https://magic.wizards.com/en/news/feature/attacking-and-blocking-2015-07-27
- Arena normally suppresses many priority moments, provides smart exceptions, and preserves manual stops/full control for unusual plays. Source: *MTG Arena Announcements—October 27, 2025*, Wizards of the Coast. https://magic.wizards.com/en/news/mtg-arena/announcements-october-27-2025
- On mobile, Arena tucks information to preserve battlefield visibility, expands it on demand, supports automatic tuck/untuck, and uses direct tap/drag combat interactions. Source: *MTG Arena: State of the Game—January 2021*, Wizards of the Coast. https://magic.wizards.com/en/news/mtg-arena/mtg-arena-state-game-january-2021-01-21
- Arena exposes auto-tap and full-control overrides because automation must remain reversible when expert timing matters. Source: *MTG Arena on Mobile FAQs*, Wizards of the Coast. https://magic.wizards.com/en/news/mtg-arena/mtg-arena-mobile-faqs-2021-01-28
- Arena's rules engine assembles the available actions for the player with priority; the client then renders the choice through highlights, buttons, or dialogs. Source: *On Whiteboards, Naps, and Living Breakthrough*, Wizards of the Coast, 2023-07-31. https://magic.wizards.com/en/news/mtg-arena/on-whiteboards-naps-and-living-breakthrough
- Arena's designers intentionally choose a fast common-case interface and fall back to a more detailed rules-accurate interface only for rare interactions. Source: *Dev Diary: Sylvan Library*, Wizards of the Coast, 2026. https://magic.wizards.com/en/news/mtg-arena/dev-diary-sylvan-library
- Arena combat stops are conditional; for example, it can skip an unnecessary blocker pause but preserves or adds stops when a relevant action may exist. Source: *State of the Game—Kamigawa: Neon Dynasty*, Wizards of the Coast, 2022-02-09. https://magic.wizards.com/en/news/mtg-arena/mtg-arena-state-game-kamigawa-neon-dynasty-2022-02-09
- Arena adapts an object's presentation to context instead of forcing one representation everywhere. Source: *We Put Battles on MTG Arena: What Was That Like?*, Wizards of the Coast, 2023. https://magic.wizards.com/en/news/mtg-arena/we-put-battles-on-mtg-arena-what-was-that-like

## Translation limits

Arena is primarily a two-player digital rules authority. MTG Table Engine supports up to eight participants and physical hidden information. Therefore:

- The app can safely automate public bookkeeping and no-op routing configured by players.
- It cannot assume that a player has no response merely because the tracked public board shows none.
- It should never auto-pass a player through a stop they explicitly requested.
- It should not require every physical permanent or card in hand to be recreated digitally.
- Multiplayer attention must identify both the active player and the current priority holder; a simple top-versus-bottom Arena layout will not scale.

## Recommended HUD model

### 1. Glance state

- Screen remains awake throughout the match.
- Show active player, phase/step, priority holder, life, poison, commander damage, and the latest meaningful public event.
- Hide action grids, deck tools, detailed zones, and permanent controls.
- Pause decorative continuous animation and expensive blur/glow work; allow short event effects.
- No interaction is expected during ordinary opponent play.

### 2. Attention state

- Wake only the relevant player's HUD visually; use a short vibration where supported.
- State the reason in plain language: `YOUR PRIORITY`, `DECLARE BLOCKERS`, `CHOOSE COMMANDER ZONE`, or `CONFIRM DAMAGE`.
- Show the consequence or next transition, not a generic “Action required.”
- Other players remain in Glance state.

### 3. Act state

- Present one primary action and at most two contextual alternatives.
- Prefer semantic events such as “Take 7 commander damage from P3” over multiple counter edits.
- Batch related public updates into one confirmation.
- Keep `Pass`, `Done`, or `No response` available when rules permit.

### 4. Inspect state

- Open only when a player taps or holds a public object/zone.
- Preserve the player's previous place when closing.
- Treat this as optional reference work, never the default match surface.

## Eight-player attention routing

For each rules window, the host-authoritative state should expose:

1. Active seat.
2. Current phase/step.
3. Priority holder.
4. Seats remaining in the pass cycle.
5. Required choices and their owning seat.
6. Public reason for the window.

Each phone derives its own presentation from those public fields. Seven phones can remain in Glance state while one enters Attention/Act. A shared display can show the entire pass ring, but personal phones should emphasize only `you`, `active player`, and `next relevant seat`.

## Product priorities

1. Finish low-attention lifecycle: screen-awake match mode, restrained haptics, reduced passive rendering.
2. Replace generic phase controls with a single contextual “next meaningful step” action.
3. Build a priority/choice router that distinguishes required input from optional response windows.
4. Add semantic one-action bookkeeping for damage, commander damage, counters, and zone changes.
5. Add a compact combat mode: declare attackers, blockers, damage confirmation, then collapse.
6. Add an optional inspect drawer for public battlefield and zones.
7. Add an eight-seat shared-display pass ring after personal-phone attention routing is stable.

## Success criteria

- A player can spend a normal opponent turn without touching their phone.
- Only the player with a real decision receives an interruptive cue.
- Common bookkeeping takes one interaction per real-world event, not one interaction per affected counter.
- Expert players can set stops or open full controls without slowing everyone by default.
- No automation depends on untracked private cards.

## Limitations

Wizards does not publish a complete current specification of every Arena HUD behavior. Product behavior also changes over time and varies by card. The recommendations above combine official Arena articles, official rules explanations, and explicit inference for a physical multiplayer companion. Arena-specific automation should be treated as a pattern, not a rules specification.
