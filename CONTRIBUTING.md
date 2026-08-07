# Contributing to Tandem

The public Tandem repository is for a clear product experience, accurate user education, accessible documentation, and intentionally supported public contracts.

## Before you begin

1. Read [REPOSITORY_BOUNDARY.md](REPOSITORY_BOUNDARY.md).
2. Search existing issues before proposing overlapping work.
3. Keep every claim accurate, especially claims about Bitcoin, custody, recovery, privacy, availability, and network status.
4. Never submit secrets, private transaction data, internal plans, operational procedures, or security-sensitive implementation details.

## Good public contributions

- Clearer explanations and safer examples
- Accessibility and responsive behavior improvements
- Local-link, semantic HTML, and reduced-motion corrections
- Public schema documentation
- Typographical and factual corrections
- Use cases that do not imply investment value or guaranteed outcomes

Protocol artifact changes require separate maintainer governance. Do not edit canonical bytes, release metadata, schemas, or golden vectors as part of a product copy change.

## Validate your change

Use Node.js 24.18.1 for every local and CI verification run.

Run:

```text
node scripts/verify-public.mjs
```

For visual changes, also review the site at narrow and wide widths, navigate with a keyboard, and verify the journey remains understandable without animation.

## Pull requests

Keep one clear purpose per pull request. Explain what changed, why it belongs publicly, how it was tested, and whether any public contract file changed. Complete the repository boundary checklist in the pull request template.

By contributing, you agree that your contribution is provided under the repository's MIT License.
