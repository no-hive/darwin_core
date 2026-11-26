# Mock journal UI completion

20 November 2026. Completes the remaining UI scope after group block 1 and form
block 2. All behavior below is an in-memory demonstration, without server data,
real uploads, invitations, durable storage, RPC or blockchain preparation.

## Delivered scope

| Agreed area | Implementation |
| --- | --- |
| All/My Findings | Narrow scientific name, Journal, text/icon Verification badge, observed date, Open; desktop table / narrow layout / gallery |
| Compact previews | No occurrenceID or dwc term URLs; useful content, journal and status prioritized |
| Finding detail | Author/observer, observation/publication dates, place, materials, remarks, classification, review method/status/deadline/voting link; full historical scientific data in a disclosure |
| Rulesets | Membership, Publishing, Verification, Voting, current rules/history; readable controls and original authored statement |
| Draft | Local clone, changed-setting frames, discard, reason, validation and current/proposed confirmation |
| Proposal creation | Does not apply rules immediately; one active rules amendment per journal, visible link; frozen base version |
| Rules voting | One member/one vote, separate quorum progress and For/Against ratio; current choice, optional abstention/change; frozen duration/eligible set/threshold/version |
| Results | Passed/Not passed/Applied states; accepted valid-version rules apply and update Overview/form/admission; rejection leaves rules unchanged |
| Ordinary verification | Pending, member votes, no self-review by default, explicit result/reason; no quorum/no decisive votes does not verify |
| Optimistic verification | Waiting period, minimum confirmations, no-objection completion; objection starts member voting and keeps Pending |
| Admission | Open, member-vote request, local invitation preview, first finding; independent membership/publishing experience conditions |
| First-finding admission | Candidate publication visible before membership; positive review grants current candidate membership, negative result preserves publication without admission |
| News | Allowed members can publish local news to Journal and Main; current publishing policy controls the action |
| Shared events | Main/Journal use the same finding, news and voting objects/statuses/covers/metrics |
| Roles | Member only, no investigator/editor/admin roles |
| Presentation | Existing palette/top navigation/footer; responsive scoped App CSS and EN/ES interface labels |

## Important demonstration boundaries

- There is no production election or permissions engine. Small local arrays show
  the agreed transitions coherently. Current user remains Alan Li.
- Proposal detail has a collapsed, explicitly labelled end-of-voting preview:
  current ballots, eligible members approve, eligible members reject, no turnout.
  These actions simulate the deadline and selected other-member ballots; they do
  not represent an early-closing role and do not send transactions or messages.
- New findings automatically start the method fixed by their current journal.
  No actual background timer/scheduler runs. Optimistic detail contains an
  explicitly labelled elapsed-period preview.
- Existing fixture finding detail offers labelled review scenarios: ordinary
  waiting, optimistic waiting, optimistic verified, objection opening voting and
  not verified. These never change scientific attributes or membership counts
  arbitrarily. Other new findings follow their journal's active policy.
- A pending candidate journal appears among Main sources labelled Candidate;
  this does not confer membership. It lets the current candidate see the same
  publication while awaiting admission.
- Existing historical multi-journal records are preserved and labelled with all
  historical journal links. New creation stores one journal. The review scenario
  for historical fixtures is tied to their first recorded journal; it is an
  explicitly limited UI fixture, not a per-journal verification ledger.
- Historical community ballots from departed members remain visible. Their
  historical eligible set includes those ballot identities, without rejoining
  the profiles to the present group. New votes freeze the current eligible set.
- Statements, reasons, names, news, scientific input and filenames retain their
  authored language/case/whitespace. Only interface and generated-system labels
  translate. No new storage keys or persistence are introduced.
- Local proposals link through an existing group route with query parameters.
  Reload can discard them; the resulting view explains the missing local scene.

## Mathematical display rules

Participation = For + Against + Abstain. Required turnout is the greater of
configured minimum participants and ceiling(eligible × quorum / 100).
Approval uses For + Against only, requires at least one decisive ballot, and
requires quorum. Majority is strictly For > Against. Two-thirds uses
3 × For >= 2 × (For + Against), without rounded percentage comparisons.
Rules for open proposals do not change after a new journal version is applied.

## Remaining outside scope

Real roles/identity enforcement, persistence, RPC, blockchain, production timing,
external taxonomy/geocoding, storage and multi-user synchronization are excluded
by the user's explicit mock-only decision. No future infrastructure is prepared.

## Publication and verification

The necessary publication build is run; no tests, typecheck, lint, browser visits,
visual comparison or baseline updates are run. Responsive behavior is implemented
in CSS, not reported as browser-verified. An explicit verification request is the
next optional task; it is not part of ordinary publication.
