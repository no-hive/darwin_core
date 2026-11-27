# Web

# Asset optimization

Run `npm run assets:optimize` after adding a large illustration. The command uses ImageMagick at build time to create WebP assets at quality 85 with method 6 and updates local source references when the result is smaller.

Run `npm run assets:validate` in CI to enforce the 500 KB maximum. The documented exceptions are the transparent governance illustration and two artwork assets whose alpha/vector detail would degrade with further conversion. Use `npm run assets:report` to review size and SHA-256 duplicates.
