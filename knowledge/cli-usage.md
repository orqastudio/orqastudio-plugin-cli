---
id: KNOW-3198c8fb
type: knowledge
name: OrqaStudio CLI Usage
status: active
plugin: "@orqastudio/plugin-cli"
relationships:
  - target: DOC-2c9bfdda
    type: synchronised-with
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
orqa graph --id EPIC-2362adfc

# Find related artifacts
orqa graph --related-to AD-c6abc8e6

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
orqa validate              # Check for errors
orqa validate --fix        # Auto-fix what can be fixed (e.g. missing inverses), then re-check
orqa validate --json       # JSON output for tooling
```

This checks: relationship targets exist, inverses are present, verbs match from/to type constraints, required frontmatter fields are present, status values are canonical.

The `--fix` flag auto-fixes objectively fixable errors (currently: missing inverse relationships). Fix all remaining errors manually before committing.

## ID Management

```bash
orqa id generate TASK      # Generate a new hex ID: TASK-a7f3b2c1
orqa id check              # Scan for duplicate IDs across the graph
orqa id check --fix        # Prompt to regenerate duplicates
orqa id check -y           # Auto-regenerate duplicates (CI/tooling mode)
orqa id migrate OLD NEW    # Rename an ID across the entire graph (all references updated)
```

IDs use the format `TYPE-XXXXXXXX` (8 lowercase hex chars). See AD-057 for details.

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
- Before committing: `orqa validate --fix` to catch and auto-fix errors
- When exploring the graph: `orqa graph` is faster than reading files
- When managing plugins: `orqa plugin` for install/uninstall/browse
- After plugin install: `orqa id check` to detect any ID collisions
