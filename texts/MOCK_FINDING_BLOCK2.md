# Mock Finding UI — block 2

Implemented 20 November 2026. Scope is the compact publication form from the
agreed plan, not the tables or rules/verification editor.

## Ten user-facing blocks

| Block | Current demo profile |
| --- | --- |
| Journal | Required, one member journal; visible first; defaults to Protocol or URL-selected group |
| Taxon | Required scientific name; choose labelled demo fixture by name/ID or enter a name manually |
| Basis | Required; readable EN/ES labels retain canonical enum values |
| When | Required observation date, optional time with explicit UTC offset |
| Where | Required locality, optional paired coordinates with a known datum and uncertainty |
| Materials | At least one local file or HTTP(S) media/reference link |
| Quantity | Unknown by default; individuals or quantity with unit, required only when selected |
| Method | Required for MachineObservation/MaterialSample; otherwise optional |
| Remarks | Optional, original text preserved |
| Research | Optional existing research linked to the selected journal |

These application requirements are not universal Darwin Core requirements.
Rulesets controls will make journal policy configurable in a later block.

## Presentation and interactions

- Single form in a roughly 740px column with 340px live publication preview.
- Mobile preview can be expanded; the form itself has no steps or hidden
  Additional details. Classification is a read-only compact taxon summary.
- Labelled genus-level fixtures provide only explicitly defined classifications.
  Their urn:dwc-demo IDs do not claim resolution by an authoritative registry.
- Labelled place fixtures populate coordinates/datum and specified place data.
  Schematic preview is not an external basemap; no geocoding/geolocation calls.
  Manual coordinate changes clear fixture country/region/water-body metadata.
- Dates omit unknown time; adding time requires an explicit UTC offset. No
  midnight, timezone, uncertainty, species or geographic details are guessed.
- Current profile is shown read-only. The model snapshots its name into
  recordedBy on creation for this agreed self-observation scenario only.
- One newly created finding has exactly one selected member journal. Existing
  records and legacy memberships/scientific data are not modified.
- Materials menu supports images, arbitrary files and links, plus drag/drop.
  Raster previews, filename/size cards, removal and cover selection are local.
  Limit: 8 files of at most 20 MB each; at most 12 links. Unsupported image
  previews fall back to a file card. No arbitrary file content is executed.
- Files are kept only as in-memory App metadata. Blob URLs never masquerade as
  DwC associatedMedia. Real links use associatedMedia / associatedReferences.
- The finding detail shows local file cards; Journal and Main use the same
  selected local cover. These previews survive in-App navigation only until
  document reload. No upload, API, RPC or persistence is implemented.
- Validation appears next to controls and focuses the first invalid field.
  Authored input is validated without trimming, translation or rewriting.

## Source

Contribution.tsx, FindingContext.tsx, FindingMaterials.tsx, finding-fixtures.ts,
FindingLocalMaterials.tsx, FindingViews.tsx, JournalEntry.tsx, repository.ts,
types.ts, ui.tsx, mantine.css, prototype-core.mjs.
Shared header, nav, palette, footer, CMS and public pages are unchanged in source.

## Publication and remaining work

Only the build required for publication is run. No tests, typecheck, browser QA,
screenshot comparison or regression baseline update is authorized by this edit.
All/My Findings journal/status columns are the next block; configurable Rulesets
and voting/verification mock scenarios follow afterward.
