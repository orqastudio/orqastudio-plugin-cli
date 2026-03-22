---
id: KNOW-6ee6c91e
type: knowledge
name: Dev Environment Management
status: active
plugin: "@orqastudio/plugin-cli"
relationships:
  - target: DOC-65eb8303
    type: synchronised-with
  - target: DOC-2c9bfdda
    type: synchronised-with

---

# Dev Environment Management

The OrqaStudio dev environment (`orqastudio-dev`) aggregates all repos as git submodules. This skill covers how to manage it.

## Structure

```
orqastudio-dev/
├── .github-org/          # Org-level metadata (profile README, etc.)
├── .orqa/                # Project-level governance artifacts
├── app/                  # Tauri v2 desktop app (Rust + Svelte 5)
├── libs/
│   ├── types/            # @orqastudio/types — shared TypeScript types
│   ├── sdk/              # @orqastudio/sdk — Svelte 5 stores, plugin registry
│   ├── cli/              # @orqastudio/cli — `orqa` binary
│   ├── claude-code-cli/  # @orqastudio/claude-code-cli — governance hooks
│   ├── integrity-validator/
│   ├── svelte-components/
│   ├── graph-visualiser/
│   └── ... (brand, eslint-config, test-config, plugin-template)
├── plugins/
│   ├── claude-integration/  # Claude AI provider plugin
│   └── software-project/    # Delivery artifact types
├── registry/
│   ├── official/         # Official plugin catalog
│   └── community/        # Community plugin catalog
├── templates/            # Plugin scaffolds (frontend, sidecar, cli-tool, full)
├── tools/debug-tool/     # Dev server controller
├── VERSION               # Canonical version (0.1.0-dev)
├── Makefile              # Dev commands
└── scripts/              # Setup and version management
```

## Key Commands

```bash
make setup              # First-time: install, build, link all libs
make dev                # Start dev environment
make verify             # Run all checks (integrity, rust, svelte, types, sdk, cli)
make sync-versions      # Sync VERSION to all repos
make bump-version V=x   # Bump version and sync
make commit-all         # Commit all dirty submodules
make push-all           # Push everything
make pull-all           # Pull everything
make release-check      # Verify all repos clean on main
make submodule-status   # Show branch/commit across all submodules
```

## Submodule Operations

```bash
# Update all submodules to latest remote
make submodule-update

# After changing a library, rebuild and re-link
cd libs/types && npx tsc && cd ../../app/ui && npm link @orqastudio/types
```

## Dependency Order

Libraries must be built in order:
1. `types` (no deps)
2. `cli` (depends on types)
3. `claude-code-cli` (depends on types + cli)
4. `sdk` (depends on types)
5. `integrity-validator` (depends on types)
6. `svelte-components` (depends on types)
7. `graph-visualiser` (depends on types)
8. `app/ui` (depends on all above)

`scripts/link-all.sh` handles this automatically.

## Adding a New Library

1. Create the repo on GitHub
2. `git submodule add git@github.com:orqastudio/repo-name.git libs/name`
3. Add to `scripts/link-all.sh` in the correct dependency position
4. Add to `.orqa/project.json` projects array
5. Add CI workflows (ci.yml, publish.yml, publish-dev.yml)
6. Run `make sync-versions` to set the canonical version
