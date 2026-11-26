# Main event feed

MainFeed.tsx owns the feed layout and its side controls; feed.ts assembles typed
events. Finding, voting, Blog article, research and group-news cards each have
their own icon, metadata, links and content. Findings link both object and author,
show observation date/taxon and an optional valid image URL. Voting cards show
the group, title/description, deadline, status and the model's weighted for/against
totals; abstentions are listed separately and excluded from the binary bar.
A zero-vote result has an empty bar. The feed does not add a second vote action.

Published Blog summaries are provided by layouts/react-app.mjs through Bootstrap
from the existing article catalog, with canonical source-language titles/deks.
Only public summary metadata is serialized, never blocks or drafts. Existing
Blog article destinations remain localized. Blog articles belong to the default
Darwin Core Protocol group (darwin-core-protocol), as do global protocol updates.
This is a real third group with all profiles as permanent members and a generated
group route; its overview lists the published Blog. Its feed checkbox controls
visibility without changing membership. The old separate Protocol blog toggle
and Recommended groups link are removed from Main. Shared-group findings
appear once and remain visible if at least one of their groups is enabled.

Checkboxes control recommendations, not membership. Groups not joined are not
included. New memberships default to visible. Sort (latest/oldest/most popular/less popular), period
(all/7/30/90 days) and excluded group IDs persist independently at
dwc-main-feed-preferences-v1; malformed/unavailable storage falls back to defaults.
Period uses real timestamp boundaries against the current browser clock; events
without dates appear only under All time. Observed dates are labeled as such,
never claimed to be submission dates. Newly added findings receive createdAt
application metadata outside DwC; it survives model restore without touching
authored values or changing storage version. Existing findings are not redated.

Existing demonstration proposals now carry explicit fixture createdAt/endsAt,
group news newsAt and research createdAt. These are demo event dates, not live
server deadlines. Existing status/membership/permission rules remain authoritative.
No backend, scheduler, real-time analytics or CMS connection was activated.

Temporary feed popularity uses existing weighted vote participation for voting,
group/research connection counts for findings, research participants and group
membership for the respective events. This is an activity proxy, explained in
the filter UI, not a claim of measured impressions/likes. Article score is zero
without engagement data. Date breaks ties. Replace with one real engagement
metric when specified. Search recommendations separately sample at most three
matching objects randomly, stable during unrelated renders, until the user
defines search popularity. The complete result list is not truncated.

Removed: App breadcrumbs, global settings/reset/About menu, Main My workspace,
Tasks React page, source route, controller, task stylesheet, live adapter/links.
Task localStorage is neither read nor deleted. The old route is no longer built.
Shared navigation, source-language guards, domain permissions and palette remain.
Old tests/fixtures that target Tasks or the former UI require a separately
requested update. No tests, typecheck, snapshots, artifact comparisons or browser
QA were requested or run; only publication build/package is performed.

Layout refinement: desktop feed caps at 720px, sidebar at 320px, total 1068px
including gap. Each event has an explicit green 1px border and independent frame.
One framed panel contains groups and all sort/time chips, always visible; chip
groups use single selection. On smaller screens the framed panel moves above
the feed and its sections stack when necessary. No primary sidebar/navigation
is introduced. A saved old blog:false preference migrates to hiddenGroups for
the default group; all other preferences and object storage remain untouched.
Existing group-count expectations in older QA fixtures need a separately
requested update; no QA or baselines were run/changed for this request.

Blog previews in Main use a compact horizontal row: a fixed 128×96px
thumbnail beside a two-line title and two-line excerpt. On mobile the thumbnail
is 72×72px. Images use object-fit:cover with explicit bounding dimensions;
source image dimensions must not expand the card. No-image rows use one column.

Main voting cards label the bar with For + score at the left and Against + score
at the right. The visible Voting score caption is removed; abstentions, if any,
remain a separate line. Weighted totals and proposal-page UI are unchanged.

Oldest orders known dates ascending, Latest descending; undated items stay last
in either chronological mode. Less popular sorts the same temporary activity
score ascending, Most popular descending, with latest date breaking score ties.
Both popularity modes display the activity-proxy explanation. All four modes
persist in the existing preference key; chip selection remains color-only.
