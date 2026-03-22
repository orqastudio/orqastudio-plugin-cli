---
id: KNOW-9e1a2f6a
type: knowledge
name: Plugin Management
status: active
plugin: "@orqastudio/plugin-cli"
relationships:
  - target: DOC-2c9bfdda
    type: synchronised-with

---

# Plugin Management

OrqaStudio plugins extend the app with new artifact types, views, relationships, sidecars, hooks, and CLI tools. Manage them via the `orqa plugin` commands.

## Plugin Types

| Type | What it provides | Build tool |
|---|---|---|
| frontend | Views + widgets (Svelte components) | svelte-package |
| sidecar | Long-running process (NDJSON protocol) | bun build |
| cli-tool | One-shot CLI command | tsc |
| full | All of the above | mixed |

## Creating a Plugin

```bash
orqa plugin create frontend    # Svelte views/widgets
orqa plugin create sidecar     # Long-running process
orqa plugin create cli-tool    # One-shot command
orqa plugin create full        # Combined
```

Each template includes:
- `orqa-plugin.json` — manifest with schemas, views, relationships
- `package.json` — dependencies and build scripts
- `.github/workflows/release.yml` — build → tar.gz → GitHub Release
- Source scaffolds

## Plugin Manifest

Every plugin has `orqa-plugin.json` at its root:

```json
{
  "name": "@yourorg/plugin-name",
  "version": "0.1.0-dev",
  "provides": {
    "schemas": [],
    "views": [],
    "widgets": [],
    "relationships": [],
    "cliTools": [],
    "hooks": []
  }
}
```

**Schemas** register artifact types. **Relationships** register typed connections. Both must have unique keys — conflicts are detected at registration and resolved via AI-suggested aliases.

## Installing Plugins

```bash
# From GitHub Releases
orqa plugin install orqastudio/orqastudio-plugin-claude

# Specific version
orqa plugin install orqastudio/orqastudio-plugin-claude --version v0.1.0

# From local path (development)
orqa plugin install ./my-plugin
```

## Publishing Plugins

1. Create a GitHub Release with a `v*` tag
2. The release workflow builds, tars, and uploads the archive
3. Add the plugin to the official or community registry
4. Users can then install from the registry

## Conflict Resolution

If two plugins register the same schema or relationship key, the app detects the conflict and asks the AI for alias suggestions. The chosen alias is stored in `project.json` under `pluginOverrides`.
