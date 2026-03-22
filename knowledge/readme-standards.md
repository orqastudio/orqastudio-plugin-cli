---
id: KNOW-4cc73a12
type: knowledge
name: README Standards
status: active
plugin: "@orqastudio/plugin-cli"
relationships:
  - target: DOC-97ea2f47
    type: synchronised-with
  - target: DOC-2c9bfdda
    type: synchronised-with

---

# README Standards

Every OrqaStudio repository must have a README.md with a canonical header and structure. The `orqa repo readme` command audits compliance.

## Required Header

Every README starts with badges, the brand banner, then the title:

```markdown
![License](https://img.shields.io/badge/license-BSL%201.1-blue)
![Status](https://img.shields.io/badge/status-pre--release-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)

![OrqaStudio](https://github.com/orqastudio/orqastudio-brand/blob/main/assets/banners/banner-1680x240.png?raw=1)

# Package Display Name
```

### Required Badges

| Badge | Required | Source |
|-------|----------|--------|
| **License** | Always | License policy for the component category |
| **Status** | Always | `pre-release`, `stable`, or `experimental` |
| **OrqaStudio banner** | Always | `orqastudio-brand` repo asset |

### Language Badges

Add a badge for each language used in the repository. Detect from file extensions present:

| Language | Detection | Badge |
|----------|-----------|-------|
| TypeScript | `.ts` or `.tsx` files | `![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)` |
| Rust | `.rs` files or `Cargo.toml` | `![Rust](https://img.shields.io/badge/Rust-000000?logo=rust&logoColor=white)` |
| Svelte | `.svelte` files | `![Svelte](https://img.shields.io/badge/Svelte-FF3E00?logo=svelte&logoColor=white)` |
| JavaScript | `.js` or `.mjs` files (only if no TypeScript) | `![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)` |
| CSS/Tailwind | `tailwind.config` or `@tailwind` usage | `![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)` |
| Shell | `.sh` files | `![Shell](https://img.shields.io/badge/Shell-4EAA25?logo=gnubash&logoColor=white)` |

Language badges go on the same line as the license and status badges, before the banner.

### Badge Order

1. License
2. Status
3. Language badges (alphabetical)
4. *(blank line)*
5. Banner image
6. *(blank line)*
7. `# Title`

## Required Sections

| Section | Required | Pattern |
|---------|----------|---------|
| Title | Yes | `# DisplayName` matching the manifest |
| Description | Yes | Opening paragraph (at least 20 characters) |
| Installation | For published packages | `## Installation` |
| Usage | For packages with APIs | `## Usage` |
| License | Yes | `## License` with the license name |

## Auditing

```bash
# Check all README files
orqa repo readme

# JSON output for CI
orqa repo readme --json
```

## Results

Each repo gets a status:
- **ok** — README exists with all required elements (badges, banner, sections)
- **missing** — no README.md found
- **incomplete** — README exists but missing required badges, banner, or sections

## Template

```markdown
![License](https://img.shields.io/badge/license-BSL%201.1-blue)
![Status](https://img.shields.io/badge/status-pre--release-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)

![OrqaStudio](https://github.com/orqastudio/orqastudio-brand/blob/main/assets/banners/banner-1680x240.png?raw=1)

# Package Display Name

One-paragraph description of what this package does and why it exists.

## Installation

\`\`\`bash
npm install @orqastudio/package-name
\`\`\`

## Usage

Brief usage example showing the primary API.

## Development

How to set up for local development (if applicable).

## License

BSL-1.1 — see [LICENSE](LICENSE) for details.
```

## Naming Convention

The README title should match `displayName` from `package.json` or `orqa-plugin.json`, not the npm package name:
- `@orqastudio/types` → `# OrqaStudio Types`
- `@orqastudio/plugin-software-project` → `# Software Project`
