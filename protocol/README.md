# Public protocol contract

This directory is an index. The canonical files stay at their fixed repository paths so their bytes and links remain stable.

## Canonical artifact

- [Normative specification](../tandem.md)
- [Specification release record](../release/spec.json)

The release record identifies the expected SHA256 digest, byte count, line count, encoding, line endings, and finalization status. Verify `tandem.md` as raw bytes. Do not normalize whitespace or line endings before hashing.

## Public schemas

- [Chapter manifest](../schemas/chapter.schema.json)
- [Close manifest](../schemas/close.schema.json)
- [Independent-indexer agreement envelope](../schemas/agreement-envelope.schema.json)

These schemas use JSON Schema Draft 2020-12 and reject unknown top-level properties.

## Public vectors

- [CREATE marker example](../vectors/create-marker.example.json)
- [Golden fixture corpus](../vectors/generated/golden.json)
- [Golden vector manifest](../vectors/generated/manifest.json)

The vector manifest binds the canonical specification hash, fixture digest, and vector root.

## Verify locally

From the repository root:

```text
node scripts/verify-public.mjs
```

The verifier checks JSON syntax, the specification byte contract, artifact hashes, vector metadata, public-only path rules, local links, site essentials, and forbidden presentation text.

## Status

The protocol is finalized. Mainnet is not active. These public artifacts do not select a network deployment or authorize transaction construction and broadcast.
