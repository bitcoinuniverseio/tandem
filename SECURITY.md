# Security policy

Tandem involves Bitcoin transactions, shared control, recovery paths, and independent verification. Treat any behavior that could cause fund loss, signing confusion, unsafe coin selection, incorrect recovery, or divergent protocol interpretation as security-sensitive.

## Report privately

Use [GitHub private vulnerability reporting](https://github.com/bitcoinuniverseio/tandem/security/advisories/new) for suspected vulnerabilities.

Do not open a public issue for a suspected vulnerability. Do not include seed phrases, private keys, wallet backups, production credentials, access tokens, personally identifying wallet data, or unrelated transaction history in any report.

Include only what maintainers need to reproduce the concern safely:

- The affected public artifact or documentation path
- The expected behavior
- The observed behavior
- Minimal reproduction steps
- Transaction or PSBT bytes only when they are synthetic or safe to disclose
- The potential impact and any known workaround

Maintainers will acknowledge a valid private report, assess severity, coordinate a correction, and agree on disclosure timing with the reporter. Public disclosure should wait until affected users can act safely.

## Public repository scope

This repository contains public product material and deliberate public protocol contracts. Internal infrastructure, deployments, operations, evidence ceremonies, private APIs, and implementation tooling are outside its scope. See [REPOSITORY_BOUNDARY.md](REPOSITORY_BOUNDARY.md).

## Network status

Mainnet is not active. No website, repository, configured transaction, or funded address activates Tandem.
