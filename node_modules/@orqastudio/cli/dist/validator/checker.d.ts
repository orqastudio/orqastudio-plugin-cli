import type { ArtifactGraph, IntegrityFinding, CheckContext } from "./types.js";
/** A check function that accepts graph + context. */
type CheckFn = (graph: ArtifactGraph, ctx: CheckContext) => IntegrityFinding[];
/**
 * All check functions — purely schema-driven.
 *
 * 1. BrokenLink — every relationship target resolves to a node
 * 2. MissingInverse — bidirectional inverse exists for every edge
 * 3. RelationshipConstraint — from/to type constraints from schema
 * 4. VocabularyCompliance — relationship type is a known schema key
 * 5. RequiredRelationship — constraints.required + minCount from schema
 * 6. CircularDependency — cycles in dependency-semantic edges
 * 7. BodyTemplate — required body sections from schema.json files
 * 8. FrontmatterRequired — required frontmatter fields from plugin schemas
 */
export declare const ALL_CHECKS: CheckFn[];
/**
 * Build a CheckContext by merging platform config + project.json + plugin manifests.
 *
 * The merged context is the single source of truth for all checks.
 */
export declare function buildCheckContext(projectRoot: string): CheckContext;
/** Run all integrity checks and return findings. */
export declare function runChecks(graph: ArtifactGraph, ctx: CheckContext): IntegrityFinding[];
/** Summary of check results. */
export interface CheckSummary {
    totalFindings: number;
    errors: number;
    warnings: number;
    byCategory: Map<string, number>;
    findings: IntegrityFinding[];
}
/** Run all checks and return a summary. */
export declare function runChecksWithSummary(graph: ArtifactGraph, ctx: CheckContext): CheckSummary;
export {};
//# sourceMappingURL=checker.d.ts.map