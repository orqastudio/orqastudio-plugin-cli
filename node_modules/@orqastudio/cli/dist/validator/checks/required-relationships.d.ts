import type { ArtifactGraph, IntegrityFinding, CheckContext } from "../types.js";
/**
 * Check that required relationship constraints are satisfied.
 *
 * When a relationship schema defines `constraints.required: true` with
 * a `minCount`, every artifact of the `from` type must have at least
 * that many outgoing relationships of that key.
 *
 * Purely schema-driven — constraints come from the merged relationship
 * definitions in ctx.relationships.
 */
export declare function checkRequiredRelationships(graph: ArtifactGraph, ctx: CheckContext): IntegrityFinding[];
//# sourceMappingURL=required-relationships.d.ts.map