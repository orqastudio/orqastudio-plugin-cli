import type { ArtifactGraph, IntegrityFinding, CheckContext } from "../types.js";
/**
 * Check for circular dependencies in relationships with "dependency" semantic.
 *
 * Purely schema-driven — the dependency semantic keys come from
 * ctx.semantics, and only forward-direction keys (those appearing as
 * `key` in a relationship definition) are traversed.
 */
export declare function checkCircularDependencies(graph: ArtifactGraph, ctx: CheckContext): IntegrityFinding[];
//# sourceMappingURL=circular-dependencies.d.ts.map