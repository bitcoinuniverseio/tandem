# Tandem

Tandem is one Bitcoin-native object controlled by two people. A pair can create it together, add chapters to its history, rotate one or both keys, close cooperatively, or use a recovery path prepared before the shared state moves.

This repository is the public home of Tandem. It contains the product experience, user and integration documentation, and the exact public protocol artifacts needed for independent inspection.

The published site is <https://bitcoinuniverseio.github.io/tandem/>.

> Mainnet is not active. The protocol is finalized, but activation remains closed until independent verification, recovery, security, signer, and operational gates are complete.

Public-boundary verification runs on the shared capacity-routed runner pool, so qualified self-hosted workers are used first and overflow is absorbed on ephemeral cloud capacity. Fork pull requests remain excluded from private self-hosted execution.

## Why Tandem

- **Shared from the first transaction.** Every cooperative state change requires the current pair.
- **One continuous history.** Chapters and control changes advance the same object instead of creating disconnected records.
- **Recovery prepared first.** State-changing transactions require a completed recovery path before broadcast.
- **No platform administrator.** Tandem grants no service the power to rewrite object state or replace participant keys.

## Explore

Open `index.html` directly, or run the local static server:

```text
node scripts/serve.mjs
```

Then visit `http://127.0.0.1:4173`.

The interactive object journey is explanatory. It does not create, sign, or broadcast Bitcoin transactions.

## Protocol dossier

The dossier is the technical layer: the specification restated as numbered, citable rules, worked examples that use the published vectors, and an in-browser pairing verifier.

- [Dossier overview](docs/protocol.html)
- [Normative specification as numbered rules](docs/specification.html)
- [Guide and worked examples](docs/guide.html)
- [Pair check tool](docs/pair-check.html)
- [Indexer semantics](docs/indexing.html)
- [JSON Schema reference](docs/schemas.html)
- [Test vectors](docs/vectors.html)
- [Independent verifier](docs/verifier.html)
- [Conformance and implementation checklist](docs/conformance.html)
- [Security, limitations, and changelog](docs/considerations.html)

## Start with the right guide

- [What is Tandem?](docs/what-is-tandem.md)
- [How it works](docs/how-it-works.md)
- [Getting started](docs/getting-started.md)
- [Safety](docs/safety.md)
- [Integration guide](docs/integrations.md)
- [Use cases](docs/use-cases.md)
- [Frequently asked questions](docs/faq.md)
- [Public roadmap](docs/roadmap.md)

## Public protocol contract

The exact public contract is indexed in [protocol/README.md](protocol/README.md). The authoritative specification bytes, schemas, release metadata, and golden vectors are retained without modification from the finalized protocol record.

## Contribute

Product copy, accessibility, public documentation, examples, and safe public integrations are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and [REPOSITORY_BOUNDARY.md](REPOSITORY_BOUNDARY.md) before opening a change.

Report security concerns privately through [GitHub private vulnerability reporting](https://github.com/bitcoinuniverseio/tandem/security/advisories/new). Do not place sensitive details in a public issue.

## License

MIT. See [LICENSE](LICENSE).
