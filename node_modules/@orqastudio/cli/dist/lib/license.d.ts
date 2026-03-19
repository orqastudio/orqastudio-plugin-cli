/**
 * License auditor — check LICENSE files across all repos in a dev environment.
 *
 * Convention:
 * - Core app + libraries: BSL-1.1 (Business Source License, converts to Apache 2.0 after 4 years)
 * - Plugins: BSL-1.1 (same as core)
 * - Templates: BSL-1.1
 * - Connectors: Apache-2.0 or MIT (third-party tools may have requirements)
 * - Tools: MIT
 */
export interface LicensePolicy {
    category: string;
    expectedLicense: string;
    description: string;
}
export declare const DEFAULT_LICENSE_POLICY: LicensePolicy[];
export interface LicenseAuditResult {
    file: string;
    category: string;
    expected: string;
    found: string | null;
    status: "ok" | "missing" | "mismatch";
}
/**
 * Audit LICENSE files across all directories in the dev environment.
 */
export declare function auditLicenses(projectRoot: string, policy?: LicensePolicy[]): LicenseAuditResult[];
//# sourceMappingURL=license.d.ts.map