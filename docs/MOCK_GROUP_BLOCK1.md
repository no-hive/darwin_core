# Mock UI block 1 — group workspace

Implemented 20 November 2026 from the agreed UI-only plan.

## Delivered

- Group tabs: Overview, Members, Voting, Journal, Rulesets, localized in EN/ES.
- Overview mosaic: members, findings/status distribution, group age, latest
  publication, active voting, 30-day publication activity, participation, rules
  summary and linked research. Each relevant widget links to the matching tab.
- All Members rows have the single role Member and current group finding counts.
- Entry/exit actions affect the shared in-memory mock. Leave requires a local
  confirmation with Stay in group; the universal Protocol group remains joined.
- Journal has a prominent Publish your finding action, type chips, local search
  and the same event cards as Main. A nonmember may join and continue to the form.
- The form receives its selected group from the Journal link. A key fixes direct
  query links after hydration; Cancel returns to the selected group's Journal.
- Old records-tab links map to Journal/findings; old research links map to the
  related-research Overview widget. Existing research detail pages remain.
- Rulesets is read-only in this block: actual community rules and current open
  membership/member-publication/one-member-one-vote summaries. No fake settings
  editor or rule-application backend was introduced.
- Existing proposal pages remain usable. Vote totals now count one profile as
  one vote; stored profile scores and historical votes are not deleted.

## Files

GroupWorkspace.tsx owns the page composition. JournalEntry.tsx was extracted from
MainFeed to keep event presentation identical in both places. group-ui.ts holds
small presentation helpers and explicitly declared fixture verification labels.
All styles are rooted under .mantine-app in mantine.css. Shared site navigation,
footer, palette and public page renderers are unchanged.

## Mock state and fixture data

Repository operations no longer write domain state to localStorage. Existing
legacy data is read on initial mount and never deleted, then actions live in
memory for the current App session. Old Main sorting/group preferences remain
as before. No new backend, RPC layer, storage integration or API was added.

Foundation dates and publication timestamps were explicitly added to demo seeds
for visual age/activity widgets. They are not historical claims or values
inferred from observation dates. Verification labels used in the Overview
legend are presentation fixtures, not a scientific validation workflow.
Activity uses known publication timestamps and excludes undated observations.

## Deferred to subsequent blocks

The unified ten-block creation form, material picker, live preview, one-journal
creation enforcement, All/My Findings columns, Rulesets editor and governance /
verification / first-finding mock scenarios remain planned. This release does
not claim those later blocks are complete.

## Validation

The publication build successfully generated React SSR/client and 72 localized
pages. No tests, typecheck, artifact comparisons, screenshots, browser preview
or visual QA were run: the user requires a separate explicit request. A build
does not establish browser behavior or pixel-level correctness. Old group-tab,
vote-weight and persistence QA expectations require adaptation when requested.
