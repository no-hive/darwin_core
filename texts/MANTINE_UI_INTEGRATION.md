# Mantine application UI

The requested Mantine UI direction is implemented with actual @mantine/core
and @mantine/hooks 9.8.1 dependencies, pinned with the npm lockfile. Reference:
https://ui.mantine.dev/ and https://mantine.dev/. Mantine is MIT licensed.
The existing React repository/model remains the data and permissions boundary.

## Navigation constraint

The user's follow-up explicitly requires the complete existing navigation.
The original src/layouts/chrome.mjs and navigation stylesheet are retained.
No AppShell replacement header, primary sidebar, reordered links or new language
switcher is introduced. Main/Search/Findings dropdown/Groups/Profile, the exact
Add a new one + highlight, collapsed/touch behavior and footer links remain.
Application.tsx updates only current-route classes/language query links for
internal content navigation, following the existing header activation rules.
The shared navigation controller still owns its existing interactions.

## Route coverage

| View | Mantine composition |
| --- | --- |
| Main | Event-specific finding/voting/article/research/news cards; side group checkboxes, sort and period filters |
| Search | Original 4:1 fern background at full opacity, rounded search input, multi-category buttons, live suggestions, compact result rows, optional refinement |
| Findings | Existing mine/all/author/query scopes, list/gallery, adjacent preview, full-page finding links |
| Finding detail | Canonical DwC property sections, media links, separate app connections and preserved legacy text |
| Add a finding | Separate route, DCP Finding Core v1 compact form and live preview; one journal, grouped context controls, local materials; no Additional details or wizard |
| Groups | Large My groups / Recommended groups sections with live counts and framed cards; Search any group! tile; no introduction/recommendation subtitle or local search |
| Group detail | Overview mosaic / Members / Voting / Journal / read-only Rulesets; in-memory join/leave; Journal publication link preselects the group |
| Proposal | Existing membership/active-state rules, voting choices and one-member/one-vote totals |
| Research | Connected findings and participants alongside each other |
| Profile | Existing directory/deep links, owner editing, clipboard, age, radar/score sliders, group links and activity |
| Retired UI | Tasks route and links, workspace settings/reset menu, breadcrumbs and Main workspace panel removed |

EN/ES copy is selected only for interface labels. Authored values use Source
components with translate=no and preserved whitespace/case. No new data source,
records, CMS, database, search backend or permissions system is activated.

## Files and styling

- Application.tsx: scoped MantineProvider, original navigation synchronization,
  local repository restore/subscriptions and content routing.
- MantineWorkspace.tsx: native React view family replacing TrustedView on active
  pages. PrototypeWorkspace/TrustedView remain as historical compatibility code.
- FindingViews.tsx: reusable native finding lists, tiles, preview and details.
- Contribution.tsx, Profile.tsx, ProfileFocus.tsx, MainFeed.tsx: native Mantine content.
- ui.tsx: shared content/heading/icons/empty/identity presentation.
- mantine.css: content layout, responsiveness and authored-text protection.
- src/build-app.mjs: scoped package CSS plus custom styles, hashed dedicated
  stylesheet copied only to App pages by layouts/react-app.mjs.

The package reset/components are wrapped in @scope (.mantine-app). Provider
variables and color-scheme are scoped to the App main element; portals render
inside its portal container. The shared external site CSS stays loaded for the
unchanged navigation/footer. Mantine styling is not loaded on public/About,
Tools, Blog or article pages. First-paint HTML background remains in place.

The content uses the original App palette: background #020f08, text #efffe8,
muted #83a68d, accent #c7ff00 and borders #1d5033. Mantine dark variables,
inputs, cards, dropdowns, modals and charts share this palette. The existing
chrome/navigation remains unchanged. Native client navigation selects views from the
actual current location (not the initial bootstrap route). Modified/new-tab
clicks and other-locale/external links keep normal browser navigation.

## Publication and limits

Publication build succeeds for the 72 localized pages and native App SSR/client.
No tests, typecheck, artifact comparisons, preview or browser/screenshot QA were
requested or run. A build is not evidence of complete browser functionality or
visual verification. Existing QA selectors/fixtures from prior UI versions need
adaptation on the next explicitly requested verification pass; no baselines
have been overwritten. The preserved repository/domain validation was not
rewritten for this design change. Previous source f55036d2be026d03f5f2406d81c4e6494719bbc2
is the pre-Mantine rollback point, with its corresponding saved Site version.

Group workspace block 1: docs/MOCK_GROUP_BLOCK1.md. Domain interactions are now
in-memory mocks; legacy browser data is read once without new domain writes.

The remaining journal UI is now completed in mock scope; see
MOCK_JOURNAL_COMPLETION.md. Rulesets are editable proposal drafts; voting and
finding verification use frozen, in-memory scenarios. All/My Findings and compact
previews prioritize journal/status and move technical identifiers to full detail.
