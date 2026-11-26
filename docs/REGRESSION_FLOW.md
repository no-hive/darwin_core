# Appearance and functionality preservation workflow

## When to run

**Checks are run only on an explicit user request.** An ordinary request to change, improve, refactor, save or publish the site is not a request to run checks. Do not automatically run tests after each change or before publication. Do not add automatic hooks/CI. Builds and packaging necessary for publication are allowed; they do not imply QA and must not implicitly run tests.

Examples of explicit requests: “check the site,” “run the full flow,” “check appearance,” “run functional tests.” Run only the requested scope. A request for one run does not automatically authorize checks of future changes. If checks were not requested, save changes and report: “Checks were not run, as agreed.” Lack of a run or baseline does not block editing, saving or publication and does not mean QA passed.

## Goal and status at the time

Improve internal structure in small steps while preserving text, images, composition, responsiveness, navigation, interactions and saved data. Build artifact baseline: commit `6e01f9a77e3c3b2e4a4d9705445de343cd26a606`, Site version 179.

SHA-256 hashes of all 252 build-output files and the hosting manifest were recorded. Existing functional checks passed for 70 EN/ES pages. Browser scenarios and strict screenshot comparisons for four screens were added. **The browser baseline had NOT yet been captured or approved.** `sites-preview` was unavailable in the managed environment (`preview relay unavailable`). Do not use an alternate server/browser to bypass that infrastructure. HTML hashes cannot replace screenshots.

For the first complete visual comparison on request, capture and inspect screenshots of the unchanged baseline in a supported browser environment. Until then, new browser tests are written but not confirmed by a real run.

## Three levels of checks

1. `npm run verify`: structure, links, SEO, bilingual support, App model, navigation, profiles, Tools, saved-data protection and article recommendations. Some checks use LinkeDOM/VM and do not replace a browser.
2. `node qa/artifacts.mjs check`: exact build comparison against the baseline. Any addition, deletion or modification of HTML/CSS/JS/fonts/images fails the check. JS/CSS formatting changes are detected too: this is an intentionally conservative barrier, not proof of visual regression.
3. `npm run qa:browser`: Chromium, a fresh browser context for every test, real DOM/Workers/downloads, user actions and screenshots. A missing screenshot is an error. Baselines are not automatically updated.

## Matrix

| Screen | Viewport | Input |
| --- | --- | --- |
| Desktop | 1440 × 1000 | mouse/keyboard |
| Tablet | 820 × 1180 | touch |
| Mobile | 390 × 844 | touch |
| Touch landscape | 844 × 390 | touch |

At each size all sitemap routes are checked: 70 × 4 = 280 full-page screenshots, plus state and separate scroll-position screenshots. The latter are needed for sticky composition: one long image does not check sticky behavior. Routes and scenarios cover both locales.

States: open menus, search suggestions, expanded About descriptions, selected article, finding form, editor/other profile, voting, reset confirmation, created task and results of each Tool. Full machine matrix: `npm run qa:coverage`.

Date is fixed at November 15, 2026, 13:00 Europe/Belgrade; DPR=1. Fonts and images must load before capture. CSS animations are disabled only for screenshots; navigation is checked with ordinary animations. Pixel tolerance is zero. The same OS, Chromium version, Playwright and fonts are required; an environment update requires separate review. Firefox, Safari, real devices, intermediate animation frames and all possible input combinations are not covered.

## First baseline run — only on request

In a portable environment with Node, npm, Python and Pillow (required by the existing build):

```sh
npm ci
npm run qa:check
npx playwright install chromium
npm run qa:browser:record
npm run qa:browser
```

Install Chromium only in a portable environment. The runner starts local server `127.0.0.1:4173`, does not use production and closes it after the run. Do not substitute the live site or use a personal browser profile. Test data is synthetic; every test starts with empty storage.

`qa:browser:record` is allowed once and only if the artifact baseline matches completely. Incomplete snapshots go into a temporary directory; the baseline appears only after a successful run. After recording, inspect the HTML report, especially About, Tools 2×2, profile and mobile navigation. Then commit `qa/baseline/screenshots/` and run normal comparison. Recording a baseline does not itself mean human approval of the design.

If the first browser run reveals an existing bug, stop, describe it separately and agree on expected behavior. Do not silently fix the site or weaken tests merely to obtain a green report.

## Changes without a verification request

1. Start from the latest authoritative checkout. Record the goal and allowed differences. A technical refactor permits no UI differences.
2. Make one small change, for example consolidate rules for one component.
3. Save/publish within the task. Build and package if needed.
4. Do not run QA. Report that it was not run. Do not update the baseline.

## Run on explicit request

1. Clarify scope only if it is not clear from the request: appearance, functionality or both. For a full run use `npm run qa:full`.
2. If baseline or browser is unavailable, mark visual verification BLOCKED; other requested available stages may run. This is a verification status, not a ban on editing/publication.
3. For individual stages use `npm run build && npm run verify`, `npm run qa:browser` or `node qa/artifacts.mjs check` as requested. Inspect assertion failures, actual/expected/diff, trace, console and HTTP errors.
4. Investigate every file that differs in build output: byte changes after internal refactoring are acceptable only after successful functional and visual checks and diff review. Screenshots remain unchanged.
5. Updating the artifact baseline is a separate deliberate change with a reason and a link to a passing browser report. Overwriting the screenshot baseline for technical refactoring is prohibited. An intentional product change requires a separate decision.
6. Report results and limits. Production checks after publication and repeat runs after later changes require explicit requests.

The initial workflow preparation completed a previously started run: 70 pages, the existing functional suite and all 252 deployment files matching. After the manual-run rule was added, QA was not automatically rerun.

## Change report

State the goal, source/final commit and publication/rollback. If checks were requested, report functional results, screenshot-comparison count, artifact baseline differences and manual review; otherwise explicitly state that checks were not run. `qa/results/` contains local JSON, HTML report, screenshot diffs and traces; they are not published on the site. `browser-pass.json` is created only after a complete successful run, tied to the build SHA-256 and including the screenshot-baseline hash. A new run deletes the previous receipt; an old report cannot validate a new build.

## Existing limitations are part of the baseline

- App remains a local demo with a fixed current user.
- Newsletter reports that its service is not connected; tests do not send email.
- Metrics are disabled until an endpoint is configured.
- Known audit defects are fixed in separate tasks with explicitly described behavior changes. A baseline does not assert that no defects exist.
- Neither a snapshot nor a finite set of scenarios guarantees absence of all bugs.

## Rollback

Do not update the baseline after a regression. Fix or revert only the current small patch; rerun on request. For production, restore the previous saved Sites version while retaining the existing access audience. Do not reset user data to pass tests.

## React App after block 5

`npm run qa:react` explicitly runs JSDOM/real react-dom: hydration of all App sitemap URLs and scenarios from `qa/react-regression.test.mjs`. It is included in manual qa:check before artifact comparison; build does not run it. Legacy VM checks are retained and do not replace React checks. JSDOM does not check layout, actual browser dialogs or screenshots. For the review requested before block 6, see `BLOCK5_REVIEW.md`. The new backend is checked separately after an explicit request; compilation does not mean SQL or real PostgreSQL was tested.

## Completion of local migration

`npm run qa:tools` checks import/exports/guards/terminate in Node threads. `npm run qa:preservation` compares CSS with original v179, body DOM with v188 and 20 Tools UI states with v187. These check program structure, not screenshots. They are included in manual qa:check, not build. Source baselines do not update automatically; future intentional visual changes require a separate decision. Results of the then-current explicit request: FINAL_REVIEW.md. The visual stage remains BLOCKED.
