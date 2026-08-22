# Tandem

Tandem is one Bitcoin-native object controlled by two people. A pair can create it together, add chapters to its history, rotate one or both keys, close cooperatively, or use a recovery path prepared before the shared state moves.

This repository is the public home of Tandem. It contains the product experience, user and integration documentation, and the exact public protocol artifacts needed for independent inspection.

> Mainnet is not active. The protocol is finalized, but activation remains closed until independent verification, recovery, security, signer, and operational gates are complete.

Public-boundary verification uses PowerShell on the shared `universe-ci` pool,
so certified Linux and Windows workers execute the same artifact checks. Fork
pull requests remain excluded from private self-hosted execution.

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

The exact public contract is indexed in [protocol/README.md](protocol/README.md). The canonical specification bytes, schemas, release metadata, and golden vectors are retained without modification from the finalized protocol record.

## Contribute

Product copy, accessibility, public documentation, examples, and safe public integrations are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and [REPOSITORY_BOUNDARY.md](REPOSITORY_BOUNDARY.md) before opening a change.

Report security concerns privately through [GitHub private vulnerability reporting](https://github.com/bitcoinuniverse/tandem/security/advisories/new). Do not place sensitive details in a public issue.

## License

MIT. See [LICENSE](LICENSE).
