# Restored App MVP and third article series — 2026-11-25

Base commit: `5a8893257adcfa5c10225cd730931958286e4453` (latest 30-article export).
This is a reconstruction of the previously delivered patch after loss of its temporary
working files. The App changes are restored from the retained implementation record.
The ten English articles were rewritten on the same retained topics/titles/slugs and
rechecked against official sources. The ten stock-photo-based covers were regenerated
in the same character-cell style. The prose and image bytes are not identical to the
lost file. The original thirty articles remain unchanged.

## Apply

Put the patch in the project root, then run:

```sh
git apply --check darwin-core-app-and-articles-restored.patch
git apply darwin-core-app-and-articles-restored.patch
npm ci
npm run build
node --test qa/app-mvp.test.mjs qa/third-series.test.mjs
```

Skip `npm ci` when dependencies are installed. Use Node matching package.json and
Python/Pillow, as required by the existing image build. No dependency versions changed.
If your separate checkout has changes on the same lines, review conflicts before applying.
The patch embeds the image bytes. `dist/` is generated and intentionally excluded.

## Included changes

- Bordered Finder/All Findings tables; horizontal scrolling retains columns on narrow
  screens. Consistent smaller icons and framed actions, preserving the App palette.
- Real finding / Test finding toggle above Add Finding. Both modes use the same
  publication permissions and scientific validation. Test mode is application metadata,
  separate from Darwin Core evidence and verification, with labels in preview, lists,
  detail and journal. The alpha stays in memory; no new backend or persistent storage.
- Short labels, compact upload (8 files, 20 MB each), existing file/link handling,
  optional coordinate disclosure opening for journal requirements or validation errors.
  No fake location diagram, decorative required asterisks, member notice or rules link.
- Wider wrapping Search category column. Native whole-card group links and separate
  join buttons. Leaving a group is in its Actions menu, with existing confirmation.
- Horizontal desktop group heading and compact widgets. EN/ES interface labels.
- Ten English-only articles and covers: Gitcoin/public goods, quadratic funding/Sybil,
  oracles, centralization, hidden dependencies, DAO delegation, contributor credit,
  IPFS persistence, zero-knowledge proofs and negative results. Current image terms
  are described in IMAGE-LICENSE.md.

## Verification limits

Checks target the build, patch application to the exact clean base, EN/ES App
interactions, test metadata and all ten new article routes/SEO/media/source links.
The older qa:react migration suite has known failures on the untouched base as well;
its old baselines have not been modified. The new DOM fixture mounts the active UI
and does not claim to test SSR hydration or visual appearance.

Browser screenshot/responsive verification depends on the managed preview service.
If unavailable, review Finder, Add Finding, Search and Groups on desktop/mobile locally.
No production publication or ZIP replacement is included. The later abstract-texture
previews from this chat are not installed on the site by this patch.
