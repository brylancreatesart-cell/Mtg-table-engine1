# MTG Table Engine project instructions

## Product

This is a physical Magic: The Gathering table companion. Physical cards remain the source of play; the app tracks public state, turn structure, life and counters, multiplayer synchronization, shared display, guest/account profiles, and Solo Test NPCs.

Communicate with the user in plain language. Explain the visible result first. The user does not want additional paid products or services.

## Source of truth and services

- GitHub repository `brylancreatesart-cell/Mtg-table-engine1` is the only source of truth.
- Vercel deploys the application. `main` is production; non-main branches are previews.
- Supabase provides authentication, profiles, and saved data.
- Replit is optional for experiments and viewing. Do not treat it as a second source of truth or production host.
- Never commit passwords, access tokens, private keys, Supabase service-role keys, or recovery codes.
- Do not enable or upgrade a paid service without explicit user authorization.

## Git safety

- Do not work directly on `main` for feature or repair work. Create a focused branch from current `main`.
- Do not merge, promote a deployment, or change production without explicit user authorization.
- Preserve `production-backup-pre-premium-2026-09-03` and its commit `8810bf4ce101d7e6997aeb1806c99bf5cc99c039` as a rollback point.
- Before editing, verify the current branch, working tree, and current remote `main`.
- Keep commits focused and stop once required verification is sufficient.

## Editing ownership

- The editable controller source is split under `scripts/app-src/`.
- `scripts/inline-101.js` is generated runtime output. Do not edit it alone.
- Use `controller-source-report.json` to find controller ownership and `styles-source-report.json` for style ownership.
- After controller or style source changes, run `python tools/build_runtime_from_source.py` and review the generated diff.
- Avoid stacking late CSS overrides or duplicate implementations. Change the existing owner.

## Verification

Match testing to the change. Important reusable checks include:

```text
node --check scripts/inline-101.js
node tools/run_authoritative_sync_qa.js
node tools/preview_smoke_test.js
node tools/phone_down_preview_smoke.js
```

Solo Test includes in-app automated QA, scenario loading, and a manual QA checklist under its advanced controls; there are currently no standalone Solo Test scripts under `tools/`. Browser smoke tests use `PREVIEW_URL` to target a deployed Vercel preview. Run the checks relevant to the changed behavior. For multiplayer, auth, mobile layout, service workers, or turn flow, verify the deployed preview in Chromium and report any console, request, or page errors.

## Database and authentication

- Treat Supabase schema, authentication, and row-level-security changes as security-sensitive.
- Inspect existing schema and policies before changing them.
- Keep row-level security enabled for exposed data and scope rows to their owners.
- Public frontend configuration may use a Supabase publishable/anon key. Never expose the service-role or secret key in browser code.
- Do not delete production data or rotate credentials without explicit authorization.

## Completion reports

Report what changed, why, the branch and preview URL, tests run, failures or limitations, and whether production was touched. Never claim an exact incident is fixed unless it was reproduced or the evidence directly proves the root cause.
