---
id: DOC-476471d2
type: doc
title: Versioning System Guide
description: "How OrqaStudio's single-version ecosystem works — the VERSION file, sync process, and dev tag convention."
category: how-to
created: 2026-03-18
updated: 2026-03-18
relationships:
  - target: KNOW-7b5c1bda
    type: synchronised-with
---

# Versioning System Guide

OrqaStudio uses a **single canonical version** for the entire ecosystem. Every repository — the app, all libraries, all plugins, connectors, and tools — shares one version number.

## The VERSION File

The `VERSION` file at the dev repo root is the single source of truth:

```
0.1.0-dev
```

All other version fields (`package.json`, `Cargo.toml`, `orqa-plugin.json`) are derived from this file.

## Version Format

- **Development:** `X.Y.Z-dev` — rolling releases from main branch
- **Stable release:** `X.Y.Z` — tagged releases, no suffix
- **Pre-release:** `X.Y.Z-rc.N` — release candidates

The `-dev` suffix is mandatory for all pre-release work. Never publish a non-dev version from main.

## Syncing

When the version changes:

```bash
# Sync VERSION to all repos
orqa version sync

# Or bump and sync in one step
orqa version bump 0.2.0-dev
```

This updates `version` fields in every `package.json`, `Cargo.toml`, `orqa-plugin.json`, and `plugin.json` across all submodules.

## Checking for Drift

```bash
# Flag any repos where the version doesn't match VERSION
orqa version check
```

The session-start hook runs this automatically to catch drift early.

## Release Process

1. `orqa version bump X.Y.Z` (drop the `-dev` suffix)
2. `git tag vX.Y.Z`
3. Push tags: `git push --tags`
4. Immediately bump to next dev: `orqa version bump X.Y.(Z+1)-dev`
