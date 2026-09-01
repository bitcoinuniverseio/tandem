# Integration guide

This repository publishes the contracts an external product can inspect without exposing internal service implementation.

Mainnet is not active. Build integrations for review and controlled testing only until an authorized network deployment is published.

## Public artifacts

| Artifact | Purpose |
|---|---|
| [`tandem.md`](../tandem.md) | Authoritative normative protocol bytes |
| [`release/spec.json`](../release/spec.json) | Hash, byte count, encoding, and finalization status |
| [`schemas/chapter.schema.json`](../schemas/chapter.schema.json) | Strict chapter manifest contract |
| [`schemas/close.schema.json`](../schemas/close.schema.json) | Strict close manifest contract |
| [`schemas/agreement-envelope.schema.json`](../schemas/agreement-envelope.schema.json) | Signed independent-indexer agreement contract |
| [`vectors/create-marker.example.json`](../vectors/create-marker.example.json) | Minimal public marker input example |
| [`vectors/generated/golden.json`](../vectors/generated/golden.json) | Authoritative valid and invalid fixture corpus |
| [`vectors/generated/manifest.json`](../vectors/generated/manifest.json) | Fixture digest and vector root |

## Verify before use

1. Hash `tandem.md` as raw bytes with SHA256.
2. Compare the digest and byte count with `release/spec.json`.
3. Validate the golden fixture file digest against the vector manifest.
4. Validate chapter, close, and agreement data against the exact published schemas.
5. Reject unknown fields where the schema sets `additionalProperties` to `false`.
6. Treat numeric counters represented as strings according to their schema patterns.

The repository verifier performs the artifact checks:

```text
node scripts/verify-public.mjs
```

## Chapter and close content

Chapter and close manifests are presentation data. Normalize them with RFC 8785 JCS before hashing when the application constructs a commitment. Retrieve only the exact payload named by `content_sha256` and verify the bytes before display.

Supported URI syntax is constrained by the public schemas. URI availability never changes on-chain validity.

## Agreement envelopes

An agreement envelope carries a authoritative tuple and an Ed25519 signature from an authorized indexer identity. A verifier should accept a height only when both independently authorized pipelines agree on the protocol ID, height, block hash, roots, and counters.

Each pipeline's parser commit, indexer commit, parser binary hash, and indexer binary hash identify that pipeline's own release. Validate those provenance fields independently against the deployment trust policy. Independent implementations are expected to have different commits and binary hashes.

Schema validity alone does not establish signer authorization. Key manifests, validity windows, and operational trust policy belong to the deployment consuming the envelope.

## Product requirements

- Label network and verification status clearly.
- Keep mainnet construction and broadcast unavailable until explicit activation.
- Fail closed for state-changing actions during indexer disagreement.
- Treat all external content as untrusted.
- Never request seed phrases or raw private keys.
- Explain cooperative and recovery paths before requesting signatures.

No private administrative endpoints or internal service topology are published in this repository.
