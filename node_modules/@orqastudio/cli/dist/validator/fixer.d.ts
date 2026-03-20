/**
 * Auto-fixer for objectively fixable integrity findings.
 *
 * Currently supports:
 * - MissingInverse: adds the bidirectional inverse relationship on the target artifact
 *
 * Uses the `yaml` library for all frontmatter manipulation — never regex.
 * Each fix reads the file, parses YAML, modifies the relationships array,
 * and writes back with proper formatting.
 */
import type { ArtifactGraph, IntegrityFinding, CheckContext } from "./types.js";
/** Result of applying a single fix. */
export interface FixResult {
    finding: IntegrityFinding;
    applied: boolean;
    targetFile: string;
    error?: string;
}
/** Summary of all fixes applied. */
export interface FixSummary {
    attempted: number;
    applied: number;
    failed: number;
    results: FixResult[];
}
/**
 * Apply all auto-fixable findings to disk.
 *
 * Currently handles:
 * - MissingInverse: parses the finding message to extract target ID and
 *   expected inverse type, then adds the relationship to the target file.
 *
 * Batches fixes per file to minimise disk I/O — multiple fixes to the
 * same target file are applied in a single read-modify-write cycle.
 */
export declare function applyFixes(findings: IntegrityFinding[], graph: ArtifactGraph, ctx: CheckContext, projectRoot: string): FixSummary;
//# sourceMappingURL=fixer.d.ts.map