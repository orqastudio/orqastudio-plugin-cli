import type { ArtifactGraph, IntegrityFinding, CheckContext } from "../types.js";

/**
 * Check for relationship edges missing their bidirectional inverse.
 *
 * Only checks relationships that are structurally valid (known vocabulary,
 * target resolves, from/to constraints pass). Invalid relationships are
 * already caught by VocabularyCompliance and RelationshipConstraint —
 * flagging a missing inverse for a relationship that shouldn't exist
 * in the first place would be misdirection.
 */
export function checkMissingInverses(graph: ArtifactGraph, ctx: CheckContext): IntegrityFinding[] {
  const findings: IntegrityFinding[] = [];

  // Build constraint lookup for validity filtering
  const constraintMap = new Map<string, { from: string[]; to: string[] }>();
  for (const rel of ctx.relationships) {
    constraintMap.set(rel.key, { from: rel.from ?? [], to: rel.to ?? [] });
    constraintMap.set(rel.inverse, { from: rel.to ?? [], to: rel.from ?? [] });
  }

  for (const node of graph.nodes.values()) {
    for (const ref of node.referencesOut) {
      if (ref.field !== "relationships" || !ref.relationshipType) continue;

      const expectedInverse = ctx.inverseMap.get(ref.relationshipType);
      if (!expectedInverse) continue; // unknown vocab — caught by VocabularyCompliance

      const target = graph.nodes.get(ref.targetId);
      if (!target) continue; // broken ref — caught by BrokenLinks

      // Skip if this relationship violates from/to constraints —
      // RelationshipConstraint already flags it, and the inverse
      // shouldn't be added for an invalid relationship
      const constraint = constraintMap.get(ref.relationshipType);
      if (constraint) {
        if (constraint.from.length > 0 && !constraint.from.includes(node.artifactType)) continue;
        if (constraint.to.length > 0 && !constraint.to.includes(target.artifactType)) continue;
      }

      const hasInverse = target.referencesOut.some(
        (r) =>
          r.field === "relationships" &&
          r.relationshipType === expectedInverse &&
          r.targetId === node.id
      );

      if (!hasInverse) {
        findings.push({
          category: "MissingInverse",
          severity: "error",
          artifactId: node.id,
          message: `${node.id} --${ref.relationshipType}--> ${ref.targetId} but ${ref.targetId} has no ${expectedInverse} edge back to ${node.id}`,
          autoFixable: true,
          fixDescription: `Add { target: "${node.id}", type: "${expectedInverse}" } to ${ref.targetId}'s relationships array`,
        });
      }
    }
  }

  return findings;
}
