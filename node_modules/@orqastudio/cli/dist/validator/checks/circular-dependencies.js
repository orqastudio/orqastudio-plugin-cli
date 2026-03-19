import { keysForSemantic } from "../types.js";
/**
 * Check for circular dependencies in relationships with "dependency" semantic.
 *
 * Purely schema-driven — the dependency semantic keys come from
 * ctx.semantics, and only forward-direction keys (those appearing as
 * `key` in a relationship definition) are traversed.
 */
export function checkCircularDependencies(graph, ctx) {
    const findings = [];
    // Get dependency keys from semantic config
    const depSemanticKeys = new Set(keysForSemantic(ctx.semantics, "dependency"));
    if (depSemanticKeys.size === 0)
        return findings;
    // Only traverse forward keys (key field, not inverse field)
    const forwardDepKeys = new Set();
    for (const rel of ctx.relationships) {
        if (depSemanticKeys.has(rel.key))
            forwardDepKeys.add(rel.key);
    }
    if (forwardDepKeys.size === 0)
        return findings;
    const visited = new Set();
    const reported = new Set();
    function dfs(nodeId, path) {
        if (path.includes(nodeId)) {
            const cycleStart = path.indexOf(nodeId);
            const cycle = path.slice(cycleStart).concat(nodeId);
            const key = [...cycle].sort().join(",");
            if (!reported.has(key)) {
                reported.add(key);
                findings.push({
                    category: "CircularDependency",
                    severity: "error",
                    artifactId: nodeId,
                    message: `Circular dependency: ${cycle.join(" → ")}`,
                    autoFixable: false,
                });
            }
            return;
        }
        if (visited.has(nodeId))
            return;
        const node = graph.nodes.get(nodeId);
        if (!node)
            return;
        const deps = node.referencesOut.filter((r) => r.relationshipType != null && forwardDepKeys.has(r.relationshipType));
        path.push(nodeId);
        for (const dep of deps) {
            dfs(dep.targetId, path);
        }
        path.pop();
        visited.add(nodeId);
    }
    // Start DFS from any node that has outgoing dependency edges
    for (const node of graph.nodes.values()) {
        const hasDeps = node.referencesOut.some((r) => r.relationshipType != null && forwardDepKeys.has(r.relationshipType));
        if (hasDeps)
            dfs(node.id, []);
    }
    return findings;
}
//# sourceMappingURL=circular-dependencies.js.map