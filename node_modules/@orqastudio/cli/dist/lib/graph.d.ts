/**
 * Artifact graph scanner and query engine for CLI usage.
 *
 * Scans the `.orqa/` directory to build a lightweight in-memory graph,
 * then supports queries by type, status, relationships, and text search.
 *
 * This allows CLI users (including Claude Code) to browse the artifact graph
 * without needing the Tauri app running.
 */
export interface GraphNode {
    /** Artifact ID (e.g. "EPIC-082"). */
    id: string;
    /** Artifact type (e.g. "epic", "task", "decision"). */
    type: string;
    /** Title from frontmatter or first heading. */
    title: string;
    /** Current status. */
    status: string;
    /** Relative file path from project root. */
    path: string;
    /** Relationships declared in frontmatter. */
    relationships: Array<{
        target: string;
        type: string;
    }>;
    /** Raw frontmatter fields. */
    frontmatter: Record<string, unknown>;
}
export interface GraphQueryOptions {
    /** Filter by artifact type(s). */
    type?: string | string[];
    /** Filter by status(es). */
    status?: string | string[];
    /** Filter by relationship target. */
    relatedTo?: string;
    /** Filter by relationship type. */
    relationshipType?: string;
    /** Text search in title. */
    search?: string;
    /** Limit number of results. */
    limit?: number;
}
export interface GraphStats {
    totalNodes: number;
    totalRelationships: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
}
/**
 * Scan the `.orqa/` directory and build an in-memory artifact graph.
 */
export declare function scanArtifactGraph(projectRoot?: string): GraphNode[];
/**
 * Query the artifact graph with filters.
 */
export declare function queryGraph(nodes: GraphNode[], options: GraphQueryOptions): GraphNode[];
/**
 * Get aggregate statistics for the graph.
 */
export declare function getGraphStats(nodes: GraphNode[]): GraphStats;
//# sourceMappingURL=graph.d.ts.map