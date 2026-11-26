# Findings as a Darwin Core Occurrence profile

Sources checked 15 November 2026:

- TDWG List of Terms, version 2026-10-13: https://dwc.tdwg.org/list/
- Current Quick Reference: https://dwc.tdwg.org/terms/
- Simple Darwin Core, version 2026-10-13: https://dwc.tdwg.org/simple/

Darwin Core is a vocabulary, not a universal fixed form. Simple Darwin Core has
no universally mandatory fields. This application uses a documented Occurrence
profile, a subset spanning record-level, Occurrence, Event, Location,
Identification, Taxon and MaterialEntity. It does not implement the entire
Darwin Core vocabulary or claim TDWG/GBIF certification or publishing readiness.

The registry in src/site/app/dwc-occurrence.mjs owns exact keys, term IRIs,
bilingual UI labels, groups, application limits and validation. Cards, details,
input, legacy input, search, suggestions, feed and profile activity use it.
The entered values remain strings in their source language, including scientific
names, identifiers, codes and vocabulary values. Only interface copy changes.

## Minimum and fields

Application minimum: scientificName and basisOfRecord. occurrenceID can be
provided or receives a newly generated urn:uuid on save. No recorder, datum,
coordinates, detection or scientific verification is inferred. eventDate,
locality, recordedBy and occurrenceRemarks are useful but optional in this
profile. Values absent from older records remain absent, not fabricated.

Basic form: occurrenceID, basisOfRecord, scientificName, recordedBy,
eventDate, locality, occurrenceRemarks, associatedMedia.

Additional sections include occurrence quantities/traits/detection/references;
event ID/time/habitat/protocol/effort/notes; geography/coordinates/datum/
uncertainty/depth/elevation; identification names/dates/qualifiers/verification;
taxonomy; collection identifiers; informationWithheld and dataGeneralizations.
The exact complete supported field list is generated below from the registry.

Important semantics:

- recordedBy is the recorder, distinct from the app uploader authorId.
- occurrenceID identifies the occurrence, distinct from the internal route id.
- basisOfRecord is the nature of the record. UI offers occurrence-related class
  values, not Event/Taxon, since this is specifically an Occurrence profile.
- The latest occurrenceStatus suggestions are detected and notDetected, not
  application review/verified badges. The profile restricts new input to these.
- organismQuantity can be an enumeration such as many or r; its type is paired.
- associatedMedia takes HTTP(S) URLs separated by | in this application.
  References and field/evidence notes must not be passed off as media URLs.
- identificationVerificationStatus is entered scientific content and is never
  inferred from app review status or a "verified example" badge.
- Scientific names are not automatically resolved or corrected; historical
  genus-level names with sp. remain unchanged pending scientific curation.
- Unknown values stay empty; no automatic zero coordinates/counts or WGS84.

## Application validation, not additional standard mandates

Field sizes are bounded per registry. Scientific name and basis are required
for NEW input. Coordinates must be paired, finite, within latitude [-90,90]
and longitude [-180,180], and have an explicit datum (including "not recorded"
when appropriate). Uncertainty must be positive and needs coordinates; zero
is not a valid uncertainty. Counts are nonnegative integers. Quantities require
quantity type; quantity itself is not restricted to numeric values. Depth and
elevation minimum must not exceed maximum.

ISO eventDate/dateIdentified input supports YYYY, YYYY-MM, YYYY-MM-DD, complete
local/zoned date-times and intervals with complete endpoints. It validates
calendar dates and rejects reversed intervals. Truncated interval endpoints,
week/ordinal dates, durations and geological ages are not accepted by this
particular UI parser; retain original wording via verbatimEventDate or the
appropriate notes rather than inventing precision. This parser is not a complete
ISO 8601 implementation. countryCode is syntax checked as two uppercase letters;
it is not resolved against a country database. eventTime remains an authored
string. Empty optional fields and all entered spelling/whitespace are retained.

## Existing data and app relations

No localStorage key/version reset or destructive migration. Existing records
are projected on read, and saved in the new shape only on the next normal state
write. Existing IDs, authorship, memberships, votes and attachments are kept.

| Earlier field | Treatment |
| --- | --- |
| scientificName | Same string, same DwC key |
| date | eventDate, same source string |
| location | locality, same source string |
| description | occurrenceRemarks, same source string |
| title | legacy.title, preserved in a clearly separate previous-content section |
| evidence | legacy.evidence; never invented as associatedMedia |
| authorId | App uploader/ownership; not recordedBy |
| groupIds / researchIds | App connections, outside the DwC field set |
| status | App moderation; not identificationVerificationStatus/occurrenceStatus |

Older records receive a deterministic occurrenceID URI derived from the site's
namespace and stable record id. The URI is an identifier, not an implemented
resolver endpoint. New records get UUID-based identifiers. These identifiers
are stable across reloads, UI locales and ordinary state saves.

All new finding headings and search titles use scientificName (or occurrenceID
if an older incomplete record lacks it), not a fabricated DwC title term.
Legacy titles and evidence remain available in the details. Search indexes the
supported source fields; UI locale does not select translated object content.

## Scope and verification

The browser-local application is updated. The separately prepared, undeployed
SQL/API v1 still has its earlier finding DTO/storage contract and must be adapted
before server activation; it is not wired into this interface. No new CMS,
database, search service, taxonomy resolver or GBIF export has been activated.
Tools workbook processing remains its own earlier pipeline, outside this UI
change. It does not gain this full field registry through this edit.

No test, typecheck or browser QA run was requested. Only the publication build
is run; existing regression scripts still include old finding fixtures and
expectations and need adaptation before a separately requested QA run. Existing
visual/artifact baselines are intentionally not rewritten for this UI change.

## Exact field registry

67 fields in this application profile.

| Key | TDWG term |
| --- | --- |
| occurrenceID | http://rs.tdwg.org/dwc/terms/occurrenceID |
| basisOfRecord | http://rs.tdwg.org/dwc/terms/basisOfRecord |
| scientificName | http://rs.tdwg.org/dwc/terms/scientificName |
| recordedBy | http://rs.tdwg.org/dwc/terms/recordedBy |
| eventDate | http://rs.tdwg.org/dwc/terms/eventDate |
| locality | http://rs.tdwg.org/dwc/terms/locality |
| occurrenceRemarks | http://rs.tdwg.org/dwc/terms/occurrenceRemarks |
| associatedMedia | http://rs.tdwg.org/dwc/terms/associatedMedia |
| recordedByID | http://rs.tdwg.org/dwc/terms/recordedByID |
| recordNumber | http://rs.tdwg.org/dwc/terms/recordNumber |
| occurrenceStatus | http://rs.tdwg.org/dwc/terms/occurrenceStatus |
| individualCount | http://rs.tdwg.org/dwc/terms/individualCount |
| organismQuantity | http://rs.tdwg.org/dwc/terms/organismQuantity |
| organismQuantityType | http://rs.tdwg.org/dwc/terms/organismQuantityType |
| sex | http://rs.tdwg.org/dwc/terms/sex |
| lifeStage | http://rs.tdwg.org/dwc/terms/lifeStage |
| reproductiveCondition | http://rs.tdwg.org/dwc/terms/reproductiveCondition |
| behavior | http://rs.tdwg.org/dwc/terms/behavior |
| associatedReferences | http://rs.tdwg.org/dwc/terms/associatedReferences |
| eventID | http://rs.tdwg.org/dwc/terms/eventID |
| eventTime | http://rs.tdwg.org/dwc/terms/eventTime |
| verbatimEventDate | http://rs.tdwg.org/dwc/terms/verbatimEventDate |
| habitat | http://rs.tdwg.org/dwc/terms/habitat |
| samplingProtocol | http://rs.tdwg.org/dwc/terms/samplingProtocol |
| samplingEffort | http://rs.tdwg.org/dwc/terms/samplingEffort |
| fieldNotes | http://rs.tdwg.org/dwc/terms/fieldNotes |
| eventRemarks | http://rs.tdwg.org/dwc/terms/eventRemarks |
| country | http://rs.tdwg.org/dwc/terms/country |
| countryCode | http://rs.tdwg.org/dwc/terms/countryCode |
| stateProvince | http://rs.tdwg.org/dwc/terms/stateProvince |
| county | http://rs.tdwg.org/dwc/terms/county |
| waterBody | http://rs.tdwg.org/dwc/terms/waterBody |
| verbatimLocality | http://rs.tdwg.org/dwc/terms/verbatimLocality |
| decimalLatitude | http://rs.tdwg.org/dwc/terms/decimalLatitude |
| decimalLongitude | http://rs.tdwg.org/dwc/terms/decimalLongitude |
| geodeticDatum | http://rs.tdwg.org/dwc/terms/geodeticDatum |
| coordinateUncertaintyInMeters | http://rs.tdwg.org/dwc/terms/coordinateUncertaintyInMeters |
| verbatimCoordinates | http://rs.tdwg.org/dwc/terms/verbatimCoordinates |
| verticalDatum | http://rs.tdwg.org/dwc/terms/verticalDatum |
| minimumDepthInMeters | http://rs.tdwg.org/dwc/terms/minimumDepthInMeters |
| maximumDepthInMeters | http://rs.tdwg.org/dwc/terms/maximumDepthInMeters |
| minimumElevationInMeters | http://rs.tdwg.org/dwc/terms/minimumElevationInMeters |
| maximumElevationInMeters | http://rs.tdwg.org/dwc/terms/maximumElevationInMeters |
| verbatimIdentification | http://rs.tdwg.org/dwc/terms/verbatimIdentification |
| identifiedBy | http://rs.tdwg.org/dwc/terms/identifiedBy |
| identifiedByID | http://rs.tdwg.org/dwc/terms/identifiedByID |
| dateIdentified | http://rs.tdwg.org/dwc/terms/dateIdentified |
| identificationQualifier | http://rs.tdwg.org/dwc/terms/identificationQualifier |
| identificationVerificationStatus | http://rs.tdwg.org/dwc/terms/identificationVerificationStatus |
| identificationRemarks | http://rs.tdwg.org/dwc/terms/identificationRemarks |
| taxonID | http://rs.tdwg.org/dwc/terms/taxonID |
| taxonRank | http://rs.tdwg.org/dwc/terms/taxonRank |
| scientificNameAuthorship | http://rs.tdwg.org/dwc/terms/scientificNameAuthorship |
| kingdom | http://rs.tdwg.org/dwc/terms/kingdom |
| phylum | http://rs.tdwg.org/dwc/terms/phylum |
| class | http://rs.tdwg.org/dwc/terms/class |
| order | http://rs.tdwg.org/dwc/terms/order |
| family | http://rs.tdwg.org/dwc/terms/family |
| genus | http://rs.tdwg.org/dwc/terms/genus |
| specificEpithet | http://rs.tdwg.org/dwc/terms/specificEpithet |
| infraspecificEpithet | http://rs.tdwg.org/dwc/terms/infraspecificEpithet |
| vernacularName | http://rs.tdwg.org/dwc/terms/vernacularName |
| institutionCode | http://rs.tdwg.org/dwc/terms/institutionCode |
| collectionCode | http://rs.tdwg.org/dwc/terms/collectionCode |
| catalogNumber | http://rs.tdwg.org/dwc/terms/catalogNumber |
| informationWithheld | http://rs.tdwg.org/dwc/terms/informationWithheld |
| dataGeneralizations | http://rs.tdwg.org/dwc/terms/dataGeneralizations |
