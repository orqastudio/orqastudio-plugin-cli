/* eslint-disable */
// THIS FILE IS AUTO-GENERATED — DO NOT EDIT BY HAND.
// Source: libs/types/src/platform/*.schema.json
// Regenerate: node scripts/generate-types.mjs

/**
 * Graph structure types for the OrqaStudio artifact graph. Both the Rust backend and TypeScript frontend use these types across the Tauri IPC boundary.
 */
export type ArtifactGraphTypes =
  | ArtifactGraph
  | ArtifactNode
  | undefined
  | ArtifactRef
  | GraphStats;

/**
 * A bidirectional graph of all governance artifacts in .orqa/. Built by scanning every .md file that carries a YAML 'id' field.
 */
export interface ArtifactGraph {
  /**
   * All artifact nodes, keyed by their 'id' frontmatter value (e.g. 'EPIC-048').
   */
  nodes: {
    [k: string]: ArtifactNode | undefined;
  };
  /**
   * Reverse-lookup index: relative file path → artifact ID.
   */
  path_index: {
    [k: string]: string | undefined;
  };
}
/**
 * A single artifact node in the bidirectional graph.
 */
export interface ArtifactNode {
  /**
   * Frontmatter 'id' field (e.g. 'EPIC-048').
   */
  id: string;
  /**
   * Source project name in organisation mode, or null for single-project mode.
   */
  project?: string | null;
  /**
   * Relative path from the project root (e.g. '.orqa/delivery/epics/EPIC-048.md').
   */
  path: string;
  /**
   * Inferred category string (e.g. 'epic', 'task', 'milestone', 'idea', 'decision').
   */
  artifact_type: string;
  /**
   * Frontmatter 'title' field, or a humanized fallback from the filename.
   */
  title: string;
  /**
   * Frontmatter 'description' field.
   */
  description?: string | null;
  /**
   * Frontmatter 'status' field.
   */
  status?: string | null;
  /**
   * Frontmatter 'priority' field (e.g. 'P1', 'P2', 'P3').
   */
  priority?: string | null;
  /**
   * Full YAML frontmatter parsed into a generic JSON object.
   */
  frontmatter: {
    [k: string]: unknown | undefined;
  };
  /**
   * Forward references declared in this node's frontmatter.
   */
  references_out: ArtifactRef[];
  /**
   * Backlinks computed from other nodes' references_out during graph construction.
   */
  references_in: ArtifactRef[];
}
/**
 * A directed reference from one artifact to another.
 */
export interface ArtifactRef {
  /**
   * The artifact ID that is referenced (the link target).
   */
  target_id: string;
  /**
   * Name of the frontmatter field that contains this reference.
   */
  field: string;
  /**
   * ID of the artifact that declares this reference (the link source).
   */
  source_id: string;
  /**
   * Semantic relationship type (e.g. 'enforced-by', 'grounded'). Only set for refs from the relationships array.
   */
  relationship_type?: string | null;
}
/**
 * Summary statistics about the artifact graph.
 */
export interface GraphStats {
  /**
   * Total number of nodes (artifacts with an 'id' field).
   */
  node_count: number;
  /**
   * Total number of directed edges (sum of all references_out lengths).
   */
  edge_count: number;
  /**
   * Nodes that have no references_out and no references_in.
   */
  orphan_count: number;
  /**
   * References whose target_id does not exist in the graph.
   */
  broken_ref_count: number;
}
