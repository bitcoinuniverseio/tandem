# Safety

Tandem coordinates real Bitcoin outputs. Product clarity cannot replace careful key management, transaction review, independent verification, or recovery practice.

## Current status

Mainnet is not active. Do not treat this repository, the product website, a configured address, or an INIT-shaped transaction as authorization to use real funds.

## Shared control

Every cooperative action requires both current keys. That protects the pair from unilateral changes, but it also means one unavailable or uncooperative participant can stop cooperative progress.

Use a fresh dedicated key for each Tandem. Never reuse seed phrases, private keys, or participant backups as content, metadata, examples, or support material.

## Recovery

Recovery transactions must be completed before the state-changing parent is broadcast. Each state change needs a matching recovery kit for the new carrier.

A recovery path still depends on correct preparation, safe export, checksum verification, restore testing, relative-lock maturity, fee conditions, and access to the participant's own signing material. Never accept a claim of guaranteed recovery.

## Transaction review

Each signer should reconstruct and verify the entire intent, including inputs, outputs, amounts, scripts, fees, sequences, locktime, key order, commitments, and recovery transactions. Do not sign a transaction based only on a friendly label or a website summary.

State-changing construction and broadcast should fail closed whenever independent indexers disagree at the same authoritative height.

## External content

Chapter and close manifests can point to external content. A commitment authenticates retrieved bytes, but does not guarantee availability, safety, legality, privacy, or decryptability.

Treat all retrieved content as untrusted. Applications should enforce content-type rules, size limits, safe rendering, and clear origin labels. Never execute retrieved content as application code.

## Privacy

Bitcoin transactions and public protocol events are observable. Do not place personal information, private conversations, legal records, credentials, location data, or secrets into public commitments or retrievable manifests without understanding the permanence and correlation risks.

## Report a concern

Use [GitHub private vulnerability reporting](https://github.com/bitcoinuniverse/tandem/security/advisories/new). Do not publish a suspected fund-loss, signing, recovery, or consensus-divergence issue before maintainers can assess it privately.
