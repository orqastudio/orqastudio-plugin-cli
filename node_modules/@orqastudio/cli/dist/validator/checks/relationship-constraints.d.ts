import type { ArtifactGraph, IntegrityFinding, CheckContext } from "../types.js";
/**
 * Validate that relationships respect their type constraints.
 *
 * Each relationship definition declares `from` and `to` type arrays.
 * For forward keys (e.g. `enforces`): source must be in `from`, target in `to`.
 * For inverse keys (e.g. `enforced-by`): constraints are flipped — source
 * must be in `to`, target must be in `from`.
 *
 * Both directions are checked. An inverse key like `informed-by` on a task
 * pointing to a skill is just as wrong as `informs` on a skill pointing
 * to a task — the schema constrains both ends.
 */
export declare function checkRelationshipConstraints(graph: ArtifactGraph, ctx: CheckContext): IntegrityFinding[];
//# sourceMappingURL=relationship-constraints.d.ts.map