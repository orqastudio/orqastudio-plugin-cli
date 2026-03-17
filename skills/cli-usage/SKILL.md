---
id: SKILL-CLI-001
type: skill
name: OrqaStudio CLI Usage
status: active
layer: plugin
plugin: "@orqastudio/plugin-cli"
---

# OrqaStudio CLI Usage

The `orqa` CLI is the command-line interface for OrqaStudio. Use it instead of raw file operations when working with the artifact graph, plugins, or validation.

## Graph Browsing

The graph command scans `.orqa/` and lets you query artifacts without the app running.

```bash
# Overview
orqa graph --stats

# Filter by type
orqa graph --type epic
orqa graph --type task --status active

# Single artifact detail (shows all relationships)
orqa graph --id EPIC-082

# Find related artifacts
orqa graph --related-to AD-055

# Delivery tree view
orqa graph --type milestone,epic,task --tree

# Text search
orqa graph --search "plugin distribution"

# JSON output for programmatic use
orqa graph --type decision --json
```

Always use `orqa graph` to understand the current state before modifying artifacts. It shows relationships that aren't visible from just reading files.

## Validation

Run before every commit:

```bash
orqa validate
```

This checks: relationship targets exist, inverses are present, verbs match from/to type constraints, required frontmatter fields are present, status values are canonical.

Fix all errors before committing. The pre-commit hook runs this automatically.

## Plugin Management

```bash
orqa plugin list                          # What's installed
orqa plugin install orqastudio/repo-name  # Install from GitHub
orqa plugin uninstall @orqastudio/name    # Remove
orqa plugin registry                      # Browse available
orqa plugin create sidecar                # Scaffold new plugin
```

## When to Use the CLI

- Before creating artifacts: `orqa graph --stats` to see the current state
- Before committing: `orqa validate` to catch errors
- When exploring the graph: `orqa graph` is faster than reading files
- When managing plugins: `orqa plugin` for install/uninstall/browse
