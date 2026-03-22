/* eslint-disable */
// THIS FILE IS AUTO-GENERATED — DO NOT EDIT BY HAND.
// Source: libs/types/src/platform/*.schema.json
// Regenerate: node scripts/generate-types.mjs

/**
 * Graph health metrics and traceability types computed by the Rust backend from the artifact graph data structure.
 */
export type MetricsTypes =
  | GraphHealth
  | HealthSnapshot
  | AncestryNode
  | AncestryChain
  | TracedArtifact
  | TraceabilityResult;

/**
 * Graph-theoretic health metrics for the artifact graph. All values are computed purely in Rust from the graph data structure.
 */
export interface GraphHealth {
  /**
   * Total number of primary nodes (excluding alias nodes in org mode).
   */
  total_nodes: number;
  /**
   * Total number of directed edges.
   */
  total_edges: number;
  /**
   * Number of weakly-connected components. 1 means fully connected.
   */
  component_count: number;
  /**
   * Largest connected component size / total nodes (0.0–1.0).
   */
  largest_component_ratio: number;
  /**
   * Nodes with zero incoming references (excluding doc artifacts).
   */
  orphan_count: number;
  /**
   * orphan_count / total_nodes * 100, rounded to 1 decimal place.
   */
  orphan_percentage: number;
  /**
   * Average number of relationships per node (edges * 2 / nodes).
   */
  avg_degree: number;
  /**
   * Edge density: edges / (nodes * (nodes - 1)), clamped 0.0–1.0.
   */
  graph_density: number;
  /**
   * Percentage of non-doc nodes that can trace a path to a pillar artifact (0.0–100.0).
   */
  pillar_traceability: number;
  /**
   * Ratio of typed relationship edges that have their inverse present (0.0–1.0).
   */
  bidirectionality_ratio: number;
  /**
   * Number of broken references (target not in graph).
   */
  broken_ref_count: number;
}
/**
 * A point-in-time snapshot of graph health metrics stored in SQLite.
 */
export interface HealthSnapshot {
  /**
   * Auto-incremented SQLite row ID.
   */
  id: number;
  /**
   * Foreign key to the projects table.
   */
  project_id: number;
  /**
   * ISO 8601 timestamp when this snapshot was recorded.
   */
  created_at: string;
  node_count: number;
  edge_count: number;
  orphan_count: number;
  broken_ref_count: number;
  /**
   * Number of Error-severity integrity findings at snapshot time.
   */
  error_count: number;
  /**
   * Number of Warning-severity integrity findings at snapshot time.
   */
  warning_count: number;
  largest_component_ratio: number;
  orphan_percentage: number;
  avg_degree: number;
  graph_density: number;
  component_count: number;
  pillar_traceability: number;
  bidirectionality_ratio: number;
}
/**
 * A single node in an ancestry chain, ordered from the query artifact up to the pillar or vision root.
 */
export interface AncestryNode {
  /**
   * Artifact ID (e.g. 'EPIC-048').
   */
  id: string;
  /**
   * Human-readable title.
   */
  title: string;
  /**
   * Artifact type string (e.g. 'epic', 'pillar').
   */
  artifact_type: string;
  /**
   * The relationship type connecting this node to the next node upward. Empty string for the terminal (pillar/vision) node.
   */
  relationship: string;
}
/**
 * An ordered path from the query artifact to a pillar or vision root.
 */
export interface AncestryChain {
  /**
   * Ordered from current artifact (index 0) to pillar/vision root (last).
   */
  path: AncestryNode[];
}
/**
 * A downstream artifact with its BFS distance from the query artifact.
 */
export interface TracedArtifact {
  /**
   * Artifact ID.
   */
  id: string;
  /**
   * BFS hops from the query artifact.
   */
  depth: number;
}
/**
 * Full traceability result for a single artifact.
 */
export interface TraceabilityResult {
  /**
   * All paths from the artifact upward to any pillar or vision.
   */
  ancestry_chains: AncestryChain[];
  /**
   * All downstream artifacts with their BFS distance.
   */
  descendants: TracedArtifact[];
  /**
   * IDs of artifacts that share at least one direct parent with this artifact.
   */
  siblings: string[];
  /**
   * Count of distinct descendants within 2 hops.
   */
  impact_radius: number;
  /**
   * True when no path exists to any pillar or vision artifact.
   */
  disconnected: boolean;
}
