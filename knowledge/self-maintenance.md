---
id: KNOW-6391d2a8
type: knowledge
name: CLI Plugin Self-Maintenance
status: active
plugin: "@orqastudio/plugin-cli"
relationships:
  - target: DOC-2c9bfdda
    type: synchronised-with

---

# CLI Plugin Self-Maintenance

This skill teaches you how to maintain and extend the CLI plugin itself. The plugin should be self-documenting — any agent should be able to add commands, update skills, and publish new versions.

## Plugin Structure

```
@orqastudio/plugin-cli/
├── orqa-plugin.json              # OrqaStudio plugin manifest
├── package.json                  # Dependencies (@orqastudio/cli, types)
├── skills/
│   ├── cli-usage/SKILL.md        # How to use the orqa CLI
│   ├── version-management/SKILL.md # How versioning works
│   ├── plugin-management/SKILL.md  # How to manage plugins
│   ├── dev-environment/SKILL.md    # How the dev environment works
│   └── self-maintenance/SKILL.md   # This file — how to maintain this plugin
├── documentation/
│   └── cli-reference.md          # User-facing CLI reference
└── commands/
    └── orqa-cli.md               # /orqa-cli slash command
```

## Adding a New Skill

1. Create `skills/<name>/SKILL.md` with proper frontmatter:
   ```yaml
   ---
   id: SKILL-CLI-NNN
   type: skill
   name: Skill Name
   status: active
   layer: plugin
   plugin: "@orqastudio/plugin-cli"
   ---
   ```
2. Write the agent-facing how-to content
3. If it has a user-facing counterpart, create a doc in `documentation/` and link with `synchronised-with`
4. Commit, push, and the skill is available in the next session

## Updating the /orqa-cli Command

Edit `commands/orqa-cli.md`. This is the content shown when a user types `/orqa-cli` in Claude Code.

## Publishing

The plugin is part of the dev environment. Version syncing is handled by `make sync-versions`. To publish independently:

1. Bump version in `package.json` and `.claude-plugin/plugin.json`
2. Create a GitHub Release with a `v*` tag
3. The release workflow packages and publishes the archive

## Principles

- **Self-documenting**: every capability has a skill that teaches agents how to use it
- **User-documented**: every skill has a paired doc for human reference
- **Discoverable**: skills use clear names and descriptions so the prompt injector can find them
- **CLI tools**: expose orqa commands as registered CLI tools in the manifest
