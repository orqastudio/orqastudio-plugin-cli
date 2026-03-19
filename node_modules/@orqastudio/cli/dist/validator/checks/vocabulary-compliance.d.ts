import type { ArtifactGraph, IntegrityFinding, CheckContext } from "../types.js";
/**
 * Check that every relationship `type` used in artifact frontmatter is a
 * known key in the merged schema (core.json + project.json + plugins).
 *
 * Purely schema-driven — the set of valid keys comes from ctx.relationships
 * and ctx.inverseMap.
 */
export declare function checkVocabularyCompliance(graph: ArtifactGraph, ctx: CheckContext): IntegrityFinding[];
//# sourceMappingURL=vocabulary-compliance.d.ts.map