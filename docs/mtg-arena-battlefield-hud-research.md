# What MTG Arena Teaches Us About a Physical-Table HUD

## Direct conclusion

We should not make MTG Table Engine look or behave like a second digital game of Magic. We should borrow Arena's **attention management**: stay quiet through routine play, surface one clear decision when it matters, and keep deeper detail available on demand.

Arena can automatically determine legal actions because its rules engine knows the complete game state. Our companion deliberately does not know every physical card or private hand. That means our automation boundary is public bookkeeping and player-configured timing—not strategic choices.

## The four HUD states

### Glance

The normal state for most of the match. The screen stays awake and shows only:

- active player and phase;
- current priority holder;
- life, poison, and commander damage;
- the latest meaningful public event.

Controls and detailed battlefield tools remain tucked away. This follows Arena's mobile approach of collapsing information until the player asks for it. [Wizards' Arena mobile overview](https://magic.wizards.com/en/news/mtg-arena/mtg-arena-state-game-january-2021-01-21)

### Attention

Only the player with a real decision is alerted. The phone should say exactly why: `YOUR PRIORITY`, `DECLARE BLOCKERS`, `COMMANDER ZONE CHOICE`, or `CONFIRM DAMAGE`. A short visual or haptic cue is appropriate; constant animation is not.

Arena suppresses many no-op priority moments and adds smart stops for situations where a meaningful response may exist. It also preserves full control for unusual timing. [Wizards' smart-priority guide](https://magic.wizards.com/en/news/mtg-arena/announcements-october-27-2025)

### Act

The relevant player sees one primary action and, at most, two useful alternatives. A real-world event should normally create one app interaction. For example, “Take 7 commander damage from P3” should update life and commander damage together.

Arena separates rules-state computation from client presentation: the rules engine identifies available actions and the client renders the necessary choice. [Wizards' Arena rules-engine diary](https://magic.wizards.com/en/news/mtg-arena/on-whiteboards-naps-and-living-breakthrough)

### Inspect

Public cards, zones, stack items, and calculation details expand only when requested, then return the player to the previous view. Arena similarly changes presentation by context instead of forcing one representation everywhere. [Wizards on presenting Battle cards](https://magic.wizards.com/en/news/mtg-arena/we-put-battles-on-mtg-arena-what-was-that-like)

## How this scales to eight players

The host-authoritative state should always identify the active seat, phase/step, priority holder, remaining pass order, required choice owner, and public reason for the window. Each phone derives a personal view from that shared state.

Seven phones can remain in Glance mode while one phone enters Attention or Act. Personal phones should emphasize only the player, the active seat, and the next relevant seat. A shared display may visualize the complete eight-seat pass ring.

This is an intentional departure from Arena's two-player battlefield layout. It preserves Arena's selective-attention pattern while fitting Commander and other multiplayer formats.

## Combat should temporarily expand

Magic combat has defined steps, but routine tabletop games do not explicitly announce every priority pass. [Wizards' combat explanation](https://magic.wizards.com/en/news/feature/attacking-and-blocking-2015-07-27) supports a compact flow:

1. Active player declares attackers.
2. Relevant defenders declare blockers.
3. Required damage assignments are confirmed.
4. Public totals and tracked permanents update together.
5. The combat interface collapses back to Glance mode.

The app should pause only where a player configured a stop, a tracked public condition requires input, or someone explicitly requests a response window.

## What we should build next

1. Complete the low-attention lifecycle: keep screens awake while reducing passive GPU work.
2. Replace generic action rows with one “next meaningful step” control.
3. Route priority and required choices to only the relevant player's phone.
4. Make damage, counters, and zone movement semantic one-action events.
5. Create a compact combat mode that expands only during combat.
6. Add an optional public-state inspection drawer.
7. Add an eight-seat pass ring to the shared display.

The design test is simple: during a normal opponent turn, a player should not need to touch their phone at all.

## Research boundary

This brief uses Wizards' official rules and Arena design articles. Wizards does not publish a complete current specification for every Arena interaction, so recommendations for our multiplayer physical companion are clearly labeled product inferences rather than Arena rules.
