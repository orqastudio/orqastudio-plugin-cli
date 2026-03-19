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
export interface ReadmeSection {
    name: string;
    required: boolean;
    pattern: RegExp;
}
export declare const REQUIRED_SECTIONS: ReadmeSection[];
export interface ReadmeAuditResult {
    dir: string;
    name: string;
    status: "ok" | "missing" | "incomplete";
    missingSections: string[];
    missingBadges: string[];
    missingBanner: boolean;
    detectedLanguages: string[];
}
/**
 * Audit README.md files across all directories in the dev environment.
 */
export declare function auditReadmes(projectRoot: string): ReadmeAuditResult[];
/**
 * Generate a canonical README template for a given package type.
 */
export declare function generateReadmeTemplate(opts: {
    name: string;
    displayName: string;
    description: string;
    category: "lib" | "plugin" | "connector" | "tool";
    license: string;
    languages: string[];
}): string;
//# sourceMappingURL=readme.d.ts.map