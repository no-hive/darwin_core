# Current scope: mock application UI

User decision: 17 November 2026. This overrides previous implementation plans
for backend/RPC preparation in the current iteration.

- Build only screens, components, responsive layouts, fixtures and in-memory
  interactions. Do not add new durable persistence or external integrations.
- Do not prepare RPC/blockchain adapters, wallets, database schemas, production
  APIs, file storage, indexers or infrastructure. Future RPC is context only.
- Preserve the existing top navigation, palette and source-language invariants.
- Group tabs: Overview, Members, Voting, Journal, Rulesets.
- Journal is the group's feed; Main aggregates those same fixture events.
- One newly created finding goes to one journal and is immediately visible.
- A single compact creation form, no Additional details, combines taxon, when,
  where and material controls. New self-observation demo recordedBy is the
  submitting profile; historical scientific content stays unchanged.
- Members have only Member role. No early-closing investigator role.
- Rulesets settings propose a vote; they do not apply immediately.
- Default: one member/one vote; rule amendments require 2/3 with quorum.
- Verification has vote and optimistic mock scenarios. An optimistic objection
  opens ordinary voting. First-finding admission is a configurable scenario.
- Verification statuses: not_verified, pending_verification, verified.
- Native file selection is local preview only, with no actual upload.
- No new global demo/reset banners or menus.
- Checks and browser QA still require a separate explicit user request.

A complete standalone Russian Markdown specification was prepared for the user.
This file records durable scope decisions; it does not implement the UI.
