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
export function checkRequiredRelationships(
  graph: ArtifactGraph,
  ctx: CheckContext,
): IntegrityFinding[] {
  const findings: IntegrityFinding[] = [];

  // Collect relationship definitions that have required constraints
  const requiredDefs: Array<{
    key: string;
    fromTypes: Set<string>;
    minCount: number;
  }> = [];

  for (const rel of ctx.relationships) {
    const constraints = (rel as Record<string, unknown>)["constraints"] as
      | Record<string, unknown>
      | undefined;
    if (!constraints) continue;
    if (constraints["required"] !== true) continue;

    const from = rel.from ?? [];
    if (from.length === 0) continue; // unconstrained source — skip

    requiredDefs.push({
      key: rel.key,
      fromTypes: new Set(from),
      minCount: typeof constraints["minCount"] === "number" ? constraints["minCount"] as number : 1,
    });
  }

  if (requiredDefs.length === 0) return findings;

  for (const node of graph.nodes.values()) {
    for (const def of requiredDefs) {
      if (!def.fromTypes.has(node.artifactType)) continue;

      const count = node.referencesOut.filter(
        (r) => r.relationshipType === def.key
      ).length;

      if (count < def.minCount) {
        findings.push({
          category: "SchemaViolation",
          severity: "error",
          artifactId: node.id,
          message: `${node.id} (${node.artifactType}) requires at least ${def.minCount} "${def.key}" relationship(s) but has ${count}`,
          autoFixable: false,
        });
      }
    }
  }

  return findings;
}
