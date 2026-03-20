/**
 * Artifact graph scanner and query engine for CLI usage.
 *
 * Scans the `.orqa/` directory to build a lightweight in-memory graph,
 * then supports queries by type, status, relationships, and text search.
 *
 * This allows CLI users (including Claude Code) to browse the artifact graph
 * without needing the Tauri app running.
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
	relationships: Array<{ target: string; type: string }>;
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

// ---------------------------------------------------------------------------
// Scanning
// ---------------------------------------------------------------------------

/**
 * Scan the `.orqa/` directory and build an in-memory artifact graph.
 */
export function scanArtifactGraph(projectRoot?: string): GraphNode[] {
	const root = projectRoot ?? process.cwd();
	const orqaDir = path.join(root, ".orqa");

	if (!fs.existsSync(orqaDir)) {
		return [];
	}

	const nodes: GraphNode[] = [];
	scanDirectory(orqaDir, root, nodes);
	return nodes;
}

function scanDirectory(dir: string, projectRoot: string, nodes: GraphNode[]): void {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			if (entry.name === "tmp" || entry.name === "node_modules" || entry.name.startsWith(".")) {
				continue;
			}
			scanDirectory(fullPath, projectRoot, nodes);
		} else if (entry.name.endsWith(".md") && entry.name !== "README.md") {
			const node = parseArtifact(fullPath, projectRoot);
			if (node) nodes.push(node);
		}
	}
}

function parseArtifact(filePath: string, projectRoot: string): GraphNode | null {
	const content = fs.readFileSync(filePath, "utf-8");

	// Extract YAML frontmatter
	const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
	if (!fmMatch) return null;

	const frontmatter = parseSimpleYaml(fmMatch[1]);
	if (!frontmatter.id) return null;

	// Extract title from first heading after frontmatter
	const afterFm = content.slice(fmMatch[0].length);
	const titleMatch = afterFm.match(/^#\s+(.+)/m);
	const title = (frontmatter.title as string) ?? titleMatch?.[1] ?? frontmatter.id as string;

	// Parse relationships
	const relationships: Array<{ target: string; type: string }> = [];
	if (Array.isArray(frontmatter.relationships)) {
		for (const rel of frontmatter.relationships) {
			if (typeof rel === "object" && rel !== null && "target" in rel && "type" in rel) {
				relationships.push({
					target: String(rel.target),
					type: String(rel.type),
				});
			}
		}
	}

	return {
		id: String(frontmatter.id),
		type: String(frontmatter.type ?? inferType(filePath)),
		title: String(title),
		status: String(frontmatter.status ?? "unknown"),
		path: path.relative(projectRoot, filePath).replace(/\\/g, "/"),
		relationships,
		frontmatter,
	};
}

function inferType(filePath: string): string {
	const parts = filePath.replace(/\\/g, "/").split("/");
	// Look for type clues in the path: .orqa/delivery/epics/ → "epic"
	for (const part of parts) {
		const singular = part.replace(/s$/, "");
		if (["epic", "task", "milestone", "idea", "decision", "rule", "lesson", "knowledge", "agent", "pillar", "persona", "research", "wireframe"].includes(singular)) {
			return singular;
		}
	}
	return "artifact";
}

/**
 * Simple YAML parser for frontmatter — handles the subset we need.
 * Not a full YAML parser; handles scalars, simple arrays, and relationship arrays.
 */
function parseSimpleYaml(yaml: string): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	const lines = yaml.split("\n");
	let currentKey = "";
	let currentArray: unknown[] | null = null;
	let currentArrayItem: Record<string, unknown> | null = null;

	for (const line of lines) {
		// Array item with fields (relationship entry)
		const arrayItemMatch = line.match(/^\s+-\s+(\w+):\s*(.+)/);
		if (arrayItemMatch && currentArray) {
			if (currentArrayItem) {
				currentArray.push(currentArrayItem);
			}
			currentArrayItem = { [arrayItemMatch[1]]: parseValue(arrayItemMatch[2]) };
			continue;
		}

		// Continuation of array item
		const arrayItemContMatch = line.match(/^\s+(\w+):\s*(.+)/);
		if (arrayItemContMatch && currentArrayItem) {
			currentArrayItem[arrayItemContMatch[1]] = parseValue(arrayItemContMatch[2]);
			continue;
		}

		// Simple array item
		const simpleArrayMatch = line.match(/^\s+-\s*(.+)/);
		if (simpleArrayMatch && currentArray) {
			if (currentArrayItem) {
				currentArray.push(currentArrayItem);
				currentArrayItem = null;
			}
			currentArray.push(parseValue(simpleArrayMatch[1]));
			continue;
		}

		// Top-level key
		const keyMatch = line.match(/^(\w[\w-]*):\s*(.*)/);
		if (keyMatch) {
			// Flush previous array
			if (currentArray) {
				if (currentArrayItem) {
					currentArray.push(currentArrayItem);
					currentArrayItem = null;
				}
				result[currentKey] = currentArray;
				currentArray = null;
			}

			currentKey = keyMatch[1];
			const value = keyMatch[2].trim();

			if (value === "" || value === "[]") {
				// Could be start of array block or empty
				currentArray = [];
			} else {
				result[currentKey] = parseValue(value);
			}
		}
	}

	// Flush final array
	if (currentArray) {
		if (currentArrayItem) {
			currentArray.push(currentArrayItem);
		}
		result[currentKey] = currentArray;
	}

	return result;
}

function parseValue(value: string): unknown {
	const trimmed = value.trim();
	if (trimmed === "true") return true;
	if (trimmed === "false") return false;
	if (trimmed === "null" || trimmed === "~") return null;
	if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
	if (/^-?\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed);
	// Strip quotes
	if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"))) {
		return trimmed.slice(1, -1);
	}
	return trimmed;
}

// ---------------------------------------------------------------------------
// Querying
// ---------------------------------------------------------------------------

/**
 * Query the artifact graph with filters.
 */
export function queryGraph(
	nodes: GraphNode[],
	options: GraphQueryOptions,
): GraphNode[] {
	let results = [...nodes];

	if (options.type) {
		const types = Array.isArray(options.type) ? options.type : [options.type];
		results = results.filter((n) => types.includes(n.type));
	}

	if (options.status) {
		const statuses = Array.isArray(options.status) ? options.status : [options.status];
		results = results.filter((n) => statuses.includes(n.status));
	}

	if (options.relatedTo) {
		const target = options.relatedTo;
		results = results.filter((n) =>
			n.relationships.some((r) => r.target === target),
		);
	}

	if (options.relationshipType) {
		const relType = options.relationshipType;
		results = results.filter((n) =>
			n.relationships.some((r) => r.type === relType),
		);
	}

	if (options.search) {
		const lower = options.search.toLowerCase();
		results = results.filter(
			(n) =>
				n.title.toLowerCase().includes(lower) ||
				n.id.toLowerCase().includes(lower),
		);
	}

	if (options.limit) {
		results = results.slice(0, options.limit);
	}

	return results;
}

/**
 * Get aggregate statistics for the graph.
 */
export function getGraphStats(nodes: GraphNode[]): GraphStats {
	const byType: Record<string, number> = {};
	const byStatus: Record<string, number> = {};
	let totalRelationships = 0;

	for (const node of nodes) {
		byType[node.type] = (byType[node.type] ?? 0) + 1;
		byStatus[node.status] = (byStatus[node.status] ?? 0) + 1;
		totalRelationships += node.relationships.length;
	}

	return {
		totalNodes: nodes.length,
		totalRelationships,
		byType,
		byStatus,
	};
}
