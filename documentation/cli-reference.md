---
id: DOC-CLI-001
type: doc
name: OrqaStudio CLI Reference
status: active
layer: plugin
plugin: "@orqastudio/plugin-cli"
relationships:
  - target: SKILL-CLI-001
    type: synchronised-with
---

# OrqaStudio CLI Reference

The `orqa` command-line interface provides tools for managing plugins, validating the artifact graph, browsing project structure, and maintaining the dev environment.

## Installation

```bash
# Global install
npm install -g @orqastudio/cli

# Or use via npx
npx @orqastudio/cli <command>

# Or via the dev environment (already linked)
make setup
```

## Commands

### orqa graph — Browse the Artifact Graph

View and query the project's artifact graph from the command line.

```bash
orqa graph --stats                          # Type and status counts
orqa graph --type epic                      # All epics
orqa graph --type task --status active      # Active tasks
orqa graph --id EPIC-082                    # Single artifact + relationships
orqa graph --related-to AD-055             # Everything connected to a decision
orqa graph --search "plugin"               # Text search in titles
orqa graph --tree                          # Delivery hierarchy view
orqa graph --json                          # JSON output
```

### orqa validate — Integrity Check

Validate the artifact graph for consistency.

```bash
orqa validate                   # Check current directory
orqa validate /path/to/project  # Check specific path
orqa validate --json            # JSON output
```

Checks: relationship targets exist, inverses are present, verbs match from/to type constraints, required frontmatter fields are present, status values are canonical.

### orqa plugin — Plugin Management

```bash
orqa plugin list                              # Installed plugins
orqa plugin install owner/repo                # Install from GitHub
orqa plugin install owner/repo --version v1   # Specific version
orqa plugin install ./local-path              # Install from filesystem
orqa plugin uninstall @orqastudio/name        # Remove
orqa plugin update                            # Update all
orqa plugin update @orqastudio/name           # Update one
orqa plugin registry                          # Browse all registries
orqa plugin registry --official               # Official only
orqa plugin registry --community              # Community only
orqa plugin create [template]                 # Scaffold (frontend/sidecar/cli-tool/full)
```

### orqa debug — Debug Tool

```bash
orqa debug              # Run the debug tool
```

## Configuration

The CLI reads from:
- `.orqa/` directory — artifact graph
- `orqa-plugin.json` — plugin manifests in `plugins/` directory
- `plugins.lock.json` — installed plugin versions
- `VERSION` — canonical version number

## Exit Codes

- `0` — success
- `1` — error (invalid input, missing file, etc.)
- Non-zero from `orqa validate` means integrity errors found
