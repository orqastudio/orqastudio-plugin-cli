/**
 * README auditor — check README files across all repos for canonical structure.
 *
 * Every repo should have a README.md with:
 * - License badge, status badge, and language badges
 * - OrqaStudio brand banner
 * - Title (# heading matching the package display name)
 * - Description paragraph
 * - Installation section (for publishable packages)
 * - Usage section
 * - License section
 */
import * as fs from "node:fs";
import * as path from "node:path";
// ── Badge and banner detection ──────────────────────────────────────────────
const BANNER_PATTERN = /!\[OrqaStudio\]\(https:\/\/github\.com\/orqastudio\/orqastudio-brand/;
const LICENSE_BADGE_PATTERN = /!\[License\]\(https:\/\/img\.shields\.io\/badge\/license/;
const STATUS_BADGE_PATTERN = /!\[Status\]\(https:\/\/img\.shields\.io\/badge\/status/;
/** Language detection: file extension → badge name. */
const LANGUAGE_DETECTORS = [
    {
        name: "Rust",
        detect: (dir) => fs.existsSync(path.join(dir, "Cargo.toml")) || hasFileWithExt(dir, ".rs"),
        badge: "![Rust](https://img.shields.io/badge/Rust-000000?logo=rust&logoColor=white)",
    },
    {
        name: "Svelte",
        detect: (dir) => hasFileWithExt(dir, ".svelte"),
        badge: "![Svelte](https://img.shields.io/badge/Svelte-FF3E00?logo=svelte&logoColor=white)",
    },
    {
        name: "Tailwind CSS",
        detect: (dir) => hasFileMatching(dir, /^tailwind\.config/),
        badge: "![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)",
    },
    {
        name: "TypeScript",
        detect: (dir) => fs.existsSync(path.join(dir, "tsconfig.json")) || hasFileWithExt(dir, ".ts"),
        badge: "![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)",
    },
    {
        name: "Shell",
        detect: (dir) => hasFileWithExt(dir, ".sh"),
        badge: "![Shell](https://img.shields.io/badge/Shell-4EAA25?logo=gnubash&logoColor=white)",
    },
];
function hasFileWithExt(dir, ext) {
    try {
        return fs.readdirSync(dir).some((f) => f.endsWith(ext)) ||
            fs.readdirSync(path.join(dir, "src")).some((f) => f.endsWith(ext));
    }
    catch {
        return false;
    }
}
function hasFileMatching(dir, pattern) {
    try {
        return fs.readdirSync(dir).some((f) => pattern.test(f));
    }
    catch {
        return false;
    }
}
export const REQUIRED_SECTIONS = [
    { name: "title", required: true, pattern: /^# .+/m },
    { name: "description", required: true, pattern: /^[A-Z].{20,}/m },
    { name: "installation", required: false, pattern: /^##\s+install/im },
    { name: "usage", required: false, pattern: /^##\s+usage/im },
    { name: "license", required: true, pattern: /^##\s+licen[sc]e/im },
];
// ── Main audit ──────────────────────────────────────────────────────────────
/**
 * Audit README.md files across all directories in the dev environment.
 */
export function auditReadmes(projectRoot) {
    const results = [];
    // App
    results.push(checkReadme(path.join(projectRoot, "app"), "app"));
    // Scan category directories
    for (const category of ["libs", "plugins", "connectors", "tools", "registry"]) {
        const dir = path.join(projectRoot, category);
        if (!fs.existsSync(dir))
            continue;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (!entry.isDirectory() || entry.name.startsWith("."))
                continue;
            results.push(checkReadme(path.join(dir, entry.name), `${category}/${entry.name}`));
        }
    }
    // Templates
    const templatesDir = path.join(projectRoot, "templates");
    if (fs.existsSync(templatesDir)) {
        results.push(checkReadme(templatesDir, "templates"));
    }
    return results;
}
function checkReadme(dir, name) {
    const readmePath = path.join(dir, "README.md");
    // Detect languages present in this repo
    const detectedLanguages = LANGUAGE_DETECTORS
        .filter((d) => d.detect(dir))
        .map((d) => d.name);
    if (!fs.existsSync(readmePath)) {
        return {
            dir,
            name,
            status: "missing",
            missingSections: REQUIRED_SECTIONS.filter((s) => s.required).map((s) => s.name),
            missingBadges: ["license", "status", ...detectedLanguages],
            missingBanner: true,
            detectedLanguages,
        };
    }
    const content = fs.readFileSync(readmePath, "utf-8");
    // Check sections
    const missingSections = [];
    for (const section of REQUIRED_SECTIONS) {
        if (section.required && !section.pattern.test(content)) {
            missingSections.push(section.name);
        }
    }
    // Check badges
    const missingBadges = [];
    if (!LICENSE_BADGE_PATTERN.test(content))
        missingBadges.push("license");
    if (!STATUS_BADGE_PATTERN.test(content))
        missingBadges.push("status");
    for (const lang of detectedLanguages) {
        const langPattern = new RegExp(`!\\[${lang}\\]`, "i");
        if (!langPattern.test(content))
            missingBadges.push(lang);
    }
    // Check banner
    const missingBanner = !BANNER_PATTERN.test(content);
    const isIncomplete = missingSections.length > 0 || missingBadges.length > 0 || missingBanner;
    return {
        dir,
        name,
        status: isIncomplete ? "incomplete" : "ok",
        missingSections,
        missingBadges,
        missingBanner,
        detectedLanguages,
    };
}
/**
 * Generate a canonical README template for a given package type.
 */
export function generateReadmeTemplate(opts) {
    // License badge
    const licenseBadge = `![License](https://img.shields.io/badge/license-${encodeURIComponent(opts.license)}-blue)`;
    const statusBadge = `![Status](https://img.shields.io/badge/status-pre--release-orange)`;
    // Language badges (alphabetical)
    const langBadges = opts.languages
        .sort()
        .map((lang) => {
        const detector = LANGUAGE_DETECTORS.find((d) => d.name === lang);
        return detector?.badge ?? "";
    })
        .filter(Boolean);
    const badgeLine = [licenseBadge, statusBadge, ...langBadges].join("\n");
    const banner = `![OrqaStudio](https://github.com/orqastudio/orqastudio-brand/blob/main/assets/banners/banner-1680x240.png?raw=1)`;
    const installSection = opts.category !== "tool"
        ? `\n## Installation\n\n\`\`\`bash\nnpm install ${opts.name}\n\`\`\`\n`
        : "";
    return `${badgeLine}

${banner}

# ${opts.displayName}

${opts.description}
${installSection}
## Usage

<!-- Add usage examples here -->

## Development

\`\`\`bash
npm install
npm run build
npm test
\`\`\`

## License

${opts.license} — see [LICENSE](LICENSE) for details.
`;
}
//# sourceMappingURL=readme.js.map