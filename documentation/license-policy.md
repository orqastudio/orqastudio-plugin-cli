---
id: DOC-a6cc3de5
title: License Policy
description: "Which licenses apply to which OrqaStudio components and how to audit compliance."
category: reference
created: 2026-03-18
updated: 2026-03-21
relationships:
  - target: KNOW-9466a88a
    type: synchronised-with
---

# License Policy

OrqaStudio uses a tiered licensing model. Each component category has a specific license chosen for its distribution context.

## Policy Table

| Category | Path Pattern | License | Rationale |
|----------|-------------|---------|-----------|
| Core app | `app/` | BSL-1.1 with Ethical Use Addendum | Source-available product, converts to Apache 2.0 (+ Addendum) after 4 years |
| Libraries | `libs/*/` | BSL-1.1 with Ethical Use Addendum | Shared code is part of the core product |
| Plugins (first-party) | `plugins/*/` | BSL-1.1 with Ethical Use Addendum | Official extensions are product features |
| Connectors | `connectors/*/` | Apache-2.0 | Third-party tool bridges need permissive licensing for compatibility |
| Templates | `templates/*/` | BSL-1.1 with Ethical Use Addendum | Scaffolding templates are a product feature |
| Tools | `tools/*/` | BSL-1.1 with Ethical Use Addendum | Dev tools are product infrastructure, not general-purpose utilities |
| Registries | `registry/*/` | MIT | Community infrastructure should be fully open |

The Ethical Use Addendum is uniform across all BSL repos — there is no BSL variant without it. The Addendum includes explicit gender identity protection. After the change date, Apache 2.0 freedoms apply but the ethical protections remain permanently.

## BSL-1.1 with Ethical Use Addendum

The primary license for OrqaStudio components:
- Source code is publicly readable and modifiable
- Non-production use is unrestricted
- Production use requires a commercial license for 4 years from release
- After the change date, the code automatically converts to Apache 2.0 with the Ethical Use Addendum remaining in force
- The licensor may grant additional use permissions (individuals, aligned charities, education, and open-source projects receive a perpetual use grant)

The Ethical Use Addendum prohibits use by organisations that actively work to harm marginalised communities. Protected characteristics include race, ethnicity, national origin, sex, gender, gender identity, gender expression, sexual orientation, disability, age, religion, and socioeconomic status.

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
