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
export function checkFrontmatterRequired(
  graph: ArtifactGraph,
  ctx: CheckContext,
): IntegrityFinding[] {
  const findings: IntegrityFinding[] = [];

  if (ctx.frontmatterRequirements.size === 0) return findings;

  for (const node of graph.nodes.values()) {
    const requiredFields = ctx.frontmatterRequirements.get(node.artifactType);
    if (!requiredFields || requiredFields.length === 0) continue;

    for (const field of requiredFields) {
      // `id` and `type` are implicit — graph construction already requires them.
      // Skip them here to avoid noisy redundant findings.
      if (field === "id" || field === "type") continue;

      if (!(field in node.frontmatter) || node.frontmatter[field] === null || node.frontmatter[field] === undefined) {
        findings.push({
          category: "SchemaViolation",
          severity: "warning",
          artifactId: node.id,
          message: `${node.id} (${node.artifactType}) is missing required frontmatter field "${field}"`,
          autoFixable: false,
        });
      }
    }
  }

  return findings;
}
