---
id: DOC-CLI-a6cc3de5
title: License Policy
description: "Which licenses apply to which OrqaStudio components and how to audit compliance."
category: reference
created: 2026-03-18
updated: 2026-03-18
relationships:
  - target: KNOW-CLI-9466a88a
    type: synchronised-with
---

# License Policy

OrqaStudio uses a tiered licensing model. Each component category has a specific license chosen for its distribution context.

## Policy Table

| Category | Path Pattern | License | Rationale |
|----------|-------------|---------|-----------|
| Core app | `app/` | BSL-1.1 | Source-available product, converts to Apache 2.0 after 4 years |
| Libraries | `libs/*/` | BSL-1.1 | Shared code is part of the core product |
| Plugins (first-party) | `plugins/*/` | BSL-1.1 | Official extensions are product features |
| Connectors | `connectors/*/` | Apache-2.0 | Third-party tool bridges need permissive licensing for compatibility |
| Templates | `templates/*/` | BSL-1.1 | Scaffolding templates are a product feature |
| Tools | `tools/*/` | MIT | Developer utilities should be freely usable by anyone |
| Registries | `registry/*/` | MIT | Community infrastructure should be fully open |

## BSL-1.1 (Business Source License)

The primary license for OrqaStudio's commercial components:
- Source code is publicly readable and modifiable
- Non-production use is unrestricted
- Production use requires a commercial license for 4 years from release
- After the change date, the code automatically converts to Apache 2.0
- The licensor may grant additional use permissions

## Auditing

```bash
orqa repo license        # Human-readable audit
orqa repo license --json # Machine-readable for CI
```

Each directory with a `package.json`, `Cargo.toml`, or `orqa-plugin.json` is checked. The audit verifies that a LICENSE file exists and contains the expected license text for that category.

## Adding New Components

When creating a new repository or submodule:
1. Determine its category from the table above
2. Copy the LICENSE file from an existing component in the same category
3. Run `orqa repo license` to verify compliance
