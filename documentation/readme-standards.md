---
id: DOC-97ea2f47
title: README Standards
description: "Canonical README structure for all OrqaStudio repositories — required badges, banner, sections, and audit process."
category: reference
created: 2026-03-18
updated: 2026-03-18
relationships:
  - target: KNOW-4cc73a12
    type: synchronised-with
---

# README Standards

Every OrqaStudio repository must have a `README.md` with a canonical header (badges + banner) and consistent sections.

## Required Header

The header appears before any content. Order matters:

```
1. Badge line: License | Status | Language badges (alphabetical)
2. (blank line)
3. OrqaStudio banner image
4. (blank line)
5. # Title
```

### Example

```markdown
![License](https://img.shields.io/badge/license-BSL%201.1-blue)
![Status](https://img.shields.io/badge/status-pre--release-orange)
![Rust](https://img.shields.io/badge/Rust-000000?logo=rust&logoColor=white)
![Svelte](https://img.shields.io/badge/Svelte-FF3E00?logo=svelte&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)

![OrqaStudio](https://github.com/orqastudio/orqastudio-brand/blob/main/assets/banners/banner-1680x240.png?raw=1)

# OrqaStudio
```

## Badge Reference

### Always Required

| Badge | Format |
|-------|--------|
| **License** | `![License](https://img.shields.io/badge/license-{LICENSE}-blue)` where `{LICENSE}` matches the license policy for the component category |
| **Status** | `![Status](https://img.shields.io/badge/status-{STATUS}-orange)` — use `pre-release`, `stable`, or `experimental` |
| **Banner** | `![OrqaStudio](https://github.com/orqastudio/orqastudio-brand/blob/main/assets/banners/banner-1680x240.png?raw=1)` |

### Language Badges

Add one badge per language detected in the repository. The `orqa repo readme` auditor detects languages automatically from file extensions.

| Language | Detection | Badge URL |
|----------|-----------|-----------|
| TypeScript | `.ts`, `.tsx` | `https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white` |
| Rust | `.rs`, `Cargo.toml` | `https://img.shields.io/badge/Rust-000000?logo=rust&logoColor=white` |
| Svelte | `.svelte` | `https://img.shields.io/badge/Svelte-FF3E00?logo=svelte&logoColor=white` |
| JavaScript | `.js`, `.mjs` (only if no TypeScript) | `https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black` |
| Tailwind CSS | `tailwind.config.*` | `https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white` |
| Shell | `.sh` | `https://img.shields.io/badge/Shell-4EAA25?logo=gnubash&logoColor=white` |

Language badges appear alphabetically after the status badge, on the same line.

## Required Sections

| Section | Always Required | Notes |
|---------|----------------|-------|
| **Title** | Yes | `# Display Name` matching the manifest's `displayName` |
| **Description** | Yes | Opening paragraph, minimum 20 characters |
| **Installation** | For published packages | `## Installation` with install command |
| **Usage** | For packages with APIs | `## Usage` with primary example |
| **License** | Yes | `## License` with license name and link |

## Auditing

```bash
orqa repo readme        # Human-readable audit
orqa repo readme --json # Machine-readable for CI
```

Results per repo: **ok** (all present), **missing** (no README), **incomplete** (missing badges, banner, or sections).
