import type { ArtifactGraph, IntegrityFinding, CheckContext } from "../types.js";
/**
 * Check that artifacts contain all required frontmatter fields declared in plugin schemas.
 *
 * Plugin schemas (provides.schemas[].frontmatter.required) declare which fields
 * must be present in every artifact of a given type. This check enforces those
 * declarations across the entire artifact graph.
 *
 * Examples caught:
 * - rules without `enforcement`
 * - lessons without `recurrence`
 * - agents without `preamble`
 *
 * Purely schema-driven — requirements come from ctx.frontmatterRequirements,
 * which is built by merging all installed plugin manifests.
 */
export declare function checkFrontmatterRequired(graph: ArtifactGraph, ctx: CheckContext): IntegrityFinding[];
//# sourceMappingURL=frontmatter-required.d.ts.map