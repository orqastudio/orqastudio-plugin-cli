---
id: DOC-65eb8303
title: Dev Environment Setup Guide
description: "How to set up the OrqaStudio dev environment — submodules, npm linking, and the multi-repo workflow."
category: onboarding
created: 2026-03-18
updated: 2026-03-18
relationships:
  - target: KNOW-6ee6c91e
    type: synchronised-with
---

# Dev Environment Setup Guide

The OrqaStudio dev environment (`orqastudio-dev`) is an organisation-mode repository that aggregates all sub-repositories via git submodules.

## First-Time Setup

```bash
# Clone with all submodules
git clone --recurse-submodules git@github.com:orqastudio/orqastudio-dev.git
cd orqastudio-dev

# Build libraries and create npm links (adds `orqa` to PATH)
bash scripts/link-all.sh
# (or: orqa setup link — if orqa is already on PATH)

# Verify orqa is available
orqa --version
```

After `link-all.sh` completes, the `orqa` command is globally available via `npm link`. All hooks, scripts, and `make verify` targets use `orqa` directly — no `npx` or full paths needed.

## Repository Structure

```
orqastudio-dev/
├── app/                  # Tauri v2 desktop app (Rust + Svelte 5 + SQLite)
├── libs/
│   ├── types/            # @orqastudio/types — shared TypeScript types + core.json
│   ├── sdk/              # @orqastudio/sdk — Svelte 5 stores, graph SDK
│   ├── cli/              # @orqastudio/cli — CLI tool (orqa command)
│   ├── svelte-components/# @orqastudio/svelte-components — shared UI
│   └── graph-visualiser/ # @orqastudio/graph-visualiser — Cytoscape viz
├── plugins/
│   ├── software/         # Software delivery plugin (milestones, epics, tasks)
│   └── cli/              # CLI tools plugin (this plugin)
├── connectors/
│   └── claude-code/      # Claude Code connector
├── .orqa/                # Project governance artifacts
└── scripts/              # Dev scripts (being absorbed into CLI)
```

## How npm Linking Works

Libraries are wired into the app via `npm link`. This creates symlinks so the app uses local source instead of published packages.

The dependency order matters:
1. `libs/types` — no dependencies, build first
2. `libs/sdk` — depends on types
3. `libs/cli` — depends on types
4. `app/ui` — depends on types, sdk, and other libs

After changing a library:
```bash
cd libs/types && npx tsc          # Rebuild the lib
cd ../../app/ui && npm link @orqastudio/types  # Re-link into app
```

## Running the App

```bash
make dev          # Start the full dev environment (Vite + Tauri)
make verify       # Run all checks (integrity, Rust tests, svelte-check, TypeScript)
```

## Submodule Workflow

Each submodule is an independent git repo. Changes are committed in the submodule first, then the dev repo commits the updated pointer:

```bash
cd libs/types
# ... make changes ...
git add -A && git commit -m "description"
git push

cd ../..
git add libs/types
git commit -m "Update types submodule"
git push
```
