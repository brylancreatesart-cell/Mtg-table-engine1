# MTG Table Engine project context

## Locations

- GitHub: https://github.com/brylancreatesart-cell/Mtg-table-engine1
- Production: https://mtg-table-engine1.vercel.app
- Vercel project: `mtg-table-engine1`
- Production branch: `main`

## Current repository references

- Current known production baseline: `a2f5abf5d566b8261f6fc067a54354f9a9ff057d`
- Protected rollback branch: `production-backup-pre-premium-2026-09-03`
- Protected rollback commit: `8810bf4ce101d7e6997aeb1806c99bf5cc99c039`
- Existing unmerged investigation branch: `hotfix/four-player-turn-reset`
- Existing hotfix head: `ca58f43dedf1571fecc4803441a26aeec98bef29`

Always verify these references against GitHub before relying on them because branches may advance.

## Technical shape

- Browser application built primarily from HTML, CSS, and JavaScript.
- `index.html` is the application shell.
- `scripts/app-src/` contains editable controller source parts.
- `scripts/inline-101.js` is generated from controller parts.
- `styles/` contains runtime styles and split style sources are tracked by `styles-source-report.json`.
- PeerJS provides live peer-to-peer table connections.
- Supabase provides cloud authentication and profile persistence.
- Scryfall supplies card information through its public API.
- Vercel serves production and branch previews.
- Playwright-based tools test deployed flows in Chromium.
- GitHub Actions contains rebuild and preview smoke workflows.

## Product priorities

- Reliable turn and phase progression.
- Authoritative multiplayer synchronization.
- Guest and registered-user flows.
- Mobile usability at a physical table.
- Shared public table display.
- Private deck information must stay private.
- Solo Test with NPC opponents.
- Clear recovery and rollback paths.
- Preserve the premium visual direction while keeping controls readable and usable.

## Accounts and costs

- GitHub, Supabase, and Replit can remain on free plans for present development needs.
- The connected Supabase organization was confirmed as Free on 2026-09-03.
- The connected Vercel account reported Pro on 2026-09-03. Review Vercel billing and downgrade to Hobby if Pro is charging and its paid features are unnecessary.
- ChatGPT Plus is already owned by the user.
- Do not enable usage-based billing or paid upgrades without explicit authorization.

## Files that should not be transferred

Do not copy credentials, browser cookies, `.env` files containing secrets, personal access tokens, database passwords, service-role keys, recovery codes, or private SSH keys into Codex chats, Replit, this repository, or this package. Connect services using their official authorization screens and store secrets in the appropriate service environment settings.
