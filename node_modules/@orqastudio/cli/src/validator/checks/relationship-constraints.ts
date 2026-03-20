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
 * pointing to a knowledge artifact is just as wrong as `informs` on a knowledge artifact pointing
 * to a task — the schema constrains both ends.
 */
export function checkRelationshipConstraints(
  graph: ArtifactGraph,
  ctx: CheckContext,
): IntegrityFinding[] {
  const findings: IntegrityFinding[] = [];

  // Build constraint lookup for ALL keys (forward AND inverse)
  const constraints = new Map<string, { fromTypes: string[]; toTypes: string[] }>();

  for (const rel of ctx.relationships) {
    const from = rel.from ?? [];
    const to = rel.to ?? [];
    if (from.length === 0 && to.length === 0) continue;

    // Forward key: source in `from`, target in `to`
    constraints.set(rel.key, { fromTypes: from, toTypes: to });

    // Inverse key: constraints flip — source in `to`, target in `from`
    if (rel.inverse !== rel.key) {
      constraints.set(rel.inverse, { fromTypes: to, toTypes: from });
    }
  }

  for (const node of graph.nodes.values()) {
    for (const ref of node.referencesOut) {
      if (!ref.relationshipType) continue;

      const constraint = constraints.get(ref.relationshipType);
      if (!constraint) continue;

      // Source type check
      if (
        constraint.fromTypes.length > 0 &&
        !constraint.fromTypes.includes(node.artifactType)
      ) {
        findings.push({
          category: "RelationshipConstraint",
          severity: "error",
          artifactId: node.id,
          message: `${node.id} (${node.artifactType}) uses "${ref.relationshipType}" but only ${constraint.fromTypes.join(", ")} types should use this relationship`,
          autoFixable: false,
        });
      }

      // Target type check
      const target = graph.nodes.get(ref.targetId);
      if (
        target &&
        constraint.toTypes.length > 0 &&
        !constraint.toTypes.includes(target.artifactType)
      ) {
        findings.push({
          category: "RelationshipConstraint",
          severity: "error",
          artifactId: node.id,
          message: `${node.id} --${ref.relationshipType}--> ${ref.targetId} (${target.artifactType}) but target should be: ${constraint.toTypes.join(", ")}`,
          autoFixable: false,
        });
      }
    }
  }

  return findings;
}
