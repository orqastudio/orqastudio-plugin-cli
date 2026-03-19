/**
 * Check that every relationship `type` used in artifact frontmatter is a
 * known key in the merged schema (core.json + project.json + plugins).
 *
 * Purely schema-driven — the set of valid keys comes from ctx.relationships
 * and ctx.inverseMap.
 */
export function checkVocabularyCompliance(graph, ctx) {
    const findings = [];
    // Build set of all known relationship keys (forward + inverse)
    const knownKeys = new Set();
    for (const rel of ctx.relationships) {
        knownKeys.add(rel.key);
        knownKeys.add(rel.inverse);
    }
    for (const node of graph.nodes.values()) {
        for (const ref of node.referencesOut) {
            if (ref.field !== "relationships" || !ref.relationshipType)
                continue;
            if (!knownKeys.has(ref.relationshipType)) {
                findings.push({
                    category: "SchemaViolation",
                    severity: "error",
                    artifactId: node.id,
                    message: `${node.id} uses unknown relationship type "${ref.relationshipType}" — not defined in core.json, project.json, or any plugin`,
                    autoFixable: false,
                });
            }
        }
    }
    return findings;
}
//# sourceMappingURL=vocabulary-compliance.js.map