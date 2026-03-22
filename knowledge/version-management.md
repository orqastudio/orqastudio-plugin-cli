---
id: KNOW-7b5c1bda
type: knowledge
name: Version Management
status: active
plugin: "@orqastudio/plugin-cli"
relationships:
  - target: DOC-476471d2
    type: synchronised-with
  - target: DOC-2c9bfdda
    type: synchronised-with

---

# Version Management

OrqaStudio uses a single canonical version across all repositories. The `VERSION` file at the dev repo root is the source of truth.

## How Versioning Works

- **One version** for the entire ecosystem: app, all libraries, all plugins
- Stored in `VERSION` at the dev repo root (e.g. `0.1.0-dev`)
- The `-dev` suffix indicates rolling releases from main
- Stable releases drop the suffix (e.g. `0.1.0`)

## Syncing Versions

When the version changes, it must be propagated to every `package.json`, `Cargo.toml`, `orqa-plugin.json`, and `plugin.json` across all submodules.

```bash
# Sync the current VERSION to all repos
make sync-versions

# Bump to a new version and sync
make bump-version V=0.2.0-dev
```

The sync script updates:
- `package.json` version fields in all libraries
- `@orqastudio/*` dependency versions in all package.json files
- `Cargo.toml` version in the app backend
- `orqa-plugin.json` version in all plugins
- `.claude-plugin/plugin.json` version in Claude Code plugins

## Committing and Pushing Version Changes

After syncing:

```bash
# Commit in all dirty submodules
make commit-all

# Push everything
make push-all

# Verify all repos are clean and on main
make release-check
```

## Publishing

- Libraries publish to GitHub Packages via `publish-dev.yml` on every push to main
- Dev versions get a git SHA suffix (e.g. `0.1.0-dev.a1b2c3d`)
- Release versions publish via `publish.yml` when a GitHub Release is created
- The publish workflow validates that the git tag matches the package.json version

## Rules

1. Never manually edit version numbers in individual repos — use `make sync-versions`
2. All `@orqastudio/*` dependencies must point to the same version
3. The `-dev` suffix is mandatory during active development
4. Stable releases require `make release-check` to pass first
