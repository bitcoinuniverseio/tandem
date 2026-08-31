# Public and private repository boundary

This repository is the public product surface for Tandem. Its purpose is to help users, contributors, and integration partners understand and explore the product without exposing internal engineering or operations.

## Content allowed here

- The static public product experience in `index.html` and `assets/`
- Public user, safety, use-case, roadmap, and integration guides in `docs/`
- Repository governance and public security reporting documents
- The authoritative public specification at `tandem.md`
- Public release metadata at `release/spec.json`
- Deliberate public contracts in `schemas/`
- The approved public example and golden artifacts in `vectors/`
- The public contract index in `protocol/README.md`
- Public issue and pull request templates
- Minimal scripts and CI used only to serve and verify this public tree

## Content forbidden here

- Reference implementation source, backend, indexer, worker, database, or administrative code
- Unit, integration, fuzz, recovery, or infrastructure test strategies and private fixtures
- Internal architecture decisions, implementation baselines, deviation ledgers, or unpublished specifications
- Deployment manifests, environment files, infrastructure configuration, hostnames, network topology, or operational endpoints
- Evidence ceremony records, raw operational logs, recovery kits, signed transaction archives, or debugging captures
- Release credentials, secret names beyond documented platform conventions, access procedures, or private API details
- Incident, rollback, backup, monitoring, key rotation, or production maintenance procedures
- Internal priorities, unfinished experiments, launch decisions, legal reviews, or private roadmaps
- Social campaigns, promotional drafts, screenshots, videos, or marketing files not actively used by the product or its documentation
- Secrets, passwords, access tokens, seed phrases, private keys, wallet backups, or production credentials

## Public verification exceptions

`scripts/serve.mjs`, `scripts/verify-public.mjs`, and the public verification workflow are allowed because they operate only on public files and contain no release, deployment, or operational behavior.

## Promotion rule

Material moves from the private engineering repository to this repository only after product, security, and maintainer review. Promotion must be intentional. Never copy an internal directory wholesale. Rewrite internal knowledge for its public audience, remove operational detail, verify every link and claim, and scan the complete change for sensitive data.

When classification is uncertain, keep the material private until maintainers make an explicit decision.
