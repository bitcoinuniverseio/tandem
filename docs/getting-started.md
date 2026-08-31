# Getting started

Tandem mainnet is not active. Do not construct or broadcast a Tandem transaction with real funds based on this repository.

You can safely explore the product model and inspect the finalized public contract today.

## Explore the object journey

Open `index.html` in a browser, or start the local static server from the repository root:

```text
node scripts/serve.mjs
```

Visit `http://127.0.0.1:4173`, then use the Object journey controls to compare CREATE, MARK, ROTATE, CLOSE, and REFUND.

The journey is a teaching tool. It never connects to a wallet, requests keys, creates a PSBT, or broadcasts a transaction.

## Understand the model

Read these guides in order:

1. [What is Tandem?](what-is-tandem.md)
2. [How it works](how-it-works.md)
3. [Safety](safety.md)
4. [Frequently asked questions](faq.md)

## Inspect the public contract

Builders can continue with:

- [Integration guide](integrations.md)
- [Authoritative protocol index](../protocol/README.md)
- [Chapter manifest schema](../schemas/chapter.schema.json)
- [Close manifest schema](../schemas/close.schema.json)
- [Agreement envelope schema](../schemas/agreement-envelope.schema.json)
- [Golden vector manifest](../vectors/generated/manifest.json)

## Verify this repository

Run the dependency-free public verifier:

```text
node scripts/verify-public.mjs
```

It checks the preserved protocol artifacts, JSON syntax, local links, public repository boundary, required site behavior, and forbidden presentation language.

## Follow readiness honestly

[The public roadmap](roadmap.md) describes the evidence required before activation. It contains no launch date because safety gates, not calendar pressure, decide readiness.
