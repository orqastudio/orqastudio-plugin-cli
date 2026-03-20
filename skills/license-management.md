---
id: SKILL-CLI-9466a88a
type: skill
name: License Management
status: active
plugin: "@orqastudio/plugin-cli"
relationships:
  - target: DOC-CLI-a6cc3de5
    type: synchronised-with
  - target: DOC-4ed362fb
    type: synchronised-with
  - target: DOC-CLI-2c9bfdda
    type: synchronised-with

---

# License Management

OrqaStudio uses a tiered licensing model. Each component category has a specific license. The `orqa repo license` command audits compliance.

## License Policy

| Category | License | Why |
|----------|---------|-----|
| App (`app/`) | BSL-1.1 | Core product — converts to Apache 2.0 after 4 years |
| Libraries (`libs/`) | BSL-1.1 | Shared code is part of the product |
| Plugins (`plugins/`) | BSL-1.1 | First-party plugins are product extensions |
| Connectors (`connectors/`) | Apache-2.0 | Third-party tool bridges need permissive licensing |
| Templates (`templates/`) | BSL-1.1 | Scaffolding is a product feature |
| Tools (`tools/`) | MIT | Dev utilities should be freely usable |
| Registries (`registry/`) | MIT | Community infrastructure should be open |

## Auditing

```bash
# Check all LICENSE files match the policy
orqa repo license

# JSON output for CI
orqa repo license --json
```

The audit checks every directory that has a `package.json`, `Cargo.toml`, or `orqa-plugin.json`. It reads the LICENSE file and compares against the expected license for that category.

## Results

Each repo gets a status:
- **ok** — LICENSE file exists and matches the expected license
- **missing** — no LICENSE file found
- **mismatch** — LICENSE file exists but contains the wrong license

## Adding a New Repo

When creating a new repository:
1. Determine its category from the table above
2. Copy the appropriate LICENSE template from an existing repo in the same category
3. Run `orqa repo license` to verify
4. The pre-commit hook will catch missing or wrong licenses

## BSL-1.1 Details

The Business Source License 1.1 is a source-available license that:
- Allows reading, modifying, and using the code for non-production purposes
- Restricts production use for 4 years from each release
- Automatically converts to Apache 2.0 after the change date
- Permits the licensor to grant additional use grants
