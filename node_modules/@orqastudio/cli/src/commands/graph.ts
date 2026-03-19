/**
 * Graph browsing command — scan and query the artifact graph from CLI.
 *
 * orqa graph [options]
 *
 * This is key for the Claude Code integration: it allows browsing
 * the full artifact graph without the Tauri app running.
 */

import { scanArtifactGraph, queryGraph, getGraphStats } from "../lib/graph.js";
import type { GraphNode, GraphQueryOptions } from "../lib/graph.js";

const USAGE = `
Usage: orqa graph [options]

Browse the artifact graph from the command line.

Options:
  --type <type>          Filter by artifact type (e.g. epic, task, decision)
  --status <status>      Filter by status (e.g. active, completed)
  --related-to <id>      Show artifacts related to the given ID
  --rel-type <type>      Filter by relationship type (e.g. delivers, informs)
  --search <query>       Text search in titles
  --limit <n>            Limit results (default: 50)
  --stats                Show aggregate statistics only
  --json                 Output as JSON
  --tree                 Show as delivery tree (hierarchy view)
  --id <id>              Show details for a specific artifact
  --help, -h             Show this help message
`.trim();

export async function runGraphCommand(args: string[]): Promise<void> {
	if (args.includes("--help") || args.includes("-h")) {
		console.log(USAGE);
		return;
	}

	const nodes = scanArtifactGraph();

	if (nodes.length === 0) {
		console.log("No artifacts found. Is there a .orqa/ directory in the current project?");
		return;
	}

	// --stats mode
	if (args.includes("--stats")) {
		const stats = getGraphStats(nodes);
		if (args.includes("--json")) {
			console.log(JSON.stringify(stats, null, 2));
		} else {
			printStats(stats);
		}
		return;
	}

	// --id mode: show single artifact details
	const idIdx = args.indexOf("--id");
	if (idIdx >= 0 && args[idIdx + 1]) {
		const id = args[idIdx + 1];
		const node = nodes.find((n) => n.id === id);
		if (!node) {
			console.error(`Artifact not found: ${id}`);
			process.exit(1);
		}
		if (args.includes("--json")) {
			console.log(JSON.stringify(node, null, 2));
		} else {
			printArtifactDetail(node, nodes);
		}
		return;
	}

	// Build query options from args
	const options: GraphQueryOptions = {};

	const typeIdx = args.indexOf("--type");
	if (typeIdx >= 0 && args[typeIdx + 1]) options.type = args[typeIdx + 1];

	const statusIdx = args.indexOf("--status");
	if (statusIdx >= 0 && args[statusIdx + 1]) options.status = args[statusIdx + 1];

	const relatedIdx = args.indexOf("--related-to");
	if (relatedIdx >= 0 && args[relatedIdx + 1]) options.relatedTo = args[relatedIdx + 1];

	const relTypeIdx = args.indexOf("--rel-type");
	if (relTypeIdx >= 0 && args[relTypeIdx + 1]) options.relationshipType = args[relTypeIdx + 1];

	const searchIdx = args.indexOf("--search");
	if (searchIdx >= 0 && args[searchIdx + 1]) options.search = args[searchIdx + 1];

	const limitIdx = args.indexOf("--limit");
	options.limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : 50;

	const results = queryGraph(nodes, options);

	if (args.includes("--json")) {
		console.log(JSON.stringify(results, null, 2));
	} else if (args.includes("--tree")) {
		printTree(results, nodes);
	} else {
		printResults(results);
	}
}

function printStats(stats: ReturnType<typeof getGraphStats>): void {
	console.log(`Artifact Graph Statistics\n`);
	console.log(`  Total artifacts: ${stats.totalNodes}`);
	console.log(`  Total relationships: ${stats.totalRelationships}\n`);

	console.log("  By type:");
	const sortedTypes = Object.entries(stats.byType).sort((a, b) => b[1] - a[1]);
	for (const [type, count] of sortedTypes) {
		console.log(`    ${type}: ${count}`);
	}

	console.log("\n  By status:");
	const sortedStatuses = Object.entries(stats.byStatus).sort((a, b) => b[1] - a[1]);
	for (const [status, count] of sortedStatuses) {
		console.log(`    ${status}: ${count}`);
	}
}

function printResults(nodes: GraphNode[]): void {
	if (nodes.length === 0) {
		console.log("No artifacts match the query.");
		return;
	}

	console.log(`Found ${nodes.length} artifact(s):\n`);

	// Group by type
	const byType = new Map<string, GraphNode[]>();
	for (const node of nodes) {
		const list = byType.get(node.type) ?? [];
		list.push(node);
		byType.set(node.type, list);
	}

	for (const [type, typeNodes] of byType) {
		console.log(`  ${type} (${typeNodes.length})`);
		for (const node of typeNodes) {
			const statusBadge = formatStatus(node.status);
			console.log(`    ${node.id}  ${statusBadge}  ${node.title}`);
		}
		console.log();
	}
}

function printArtifactDetail(node: GraphNode, allNodes: GraphNode[]): void {
	console.log(`\n${node.id}: ${node.title}`);
	console.log(`${"─".repeat(60)}`);
	console.log(`  Type:   ${node.type}`);
	console.log(`  Status: ${formatStatus(node.status)}`);
	console.log(`  Path:   ${node.path}`);

	if (node.relationships.length > 0) {
		console.log(`\n  Relationships (${node.relationships.length}):`);
		for (const rel of node.relationships) {
			const target = allNodes.find((n) => n.id === rel.target);
			const targetTitle = target ? ` — ${target.title}` : "";
			console.log(`    ${rel.type} → ${rel.target}${targetTitle}`);
		}
	}

	// Show reverse relationships (what points to this artifact)
	const incoming = allNodes.filter((n) =>
		n.relationships.some((r) => r.target === node.id),
	);
	if (incoming.length > 0) {
		console.log(`\n  Referenced by (${incoming.length}):`);
		for (const src of incoming) {
			const rels = src.relationships.filter((r) => r.target === node.id);
			for (const rel of rels) {
				console.log(`    ${src.id} (${rel.type}) — ${src.title}`);
			}
		}
	}

	console.log();
}

function printTree(results: GraphNode[], allNodes: GraphNode[]): void {
	// Build delivery hierarchy: milestone → epic → task
	const milestones = results.filter((n) => n.type === "milestone");
	const epics = results.filter((n) => n.type === "epic");
	const tasks = results.filter((n) => n.type === "task");

	if (milestones.length === 0 && epics.length === 0) {
		console.log("No delivery hierarchy found. Use --type to filter.");
		printResults(results);
		return;
	}

	console.log("Delivery Tree:\n");

	for (const milestone of milestones) {
		console.log(`${formatStatus(milestone.status)} ${milestone.id}: ${milestone.title}`);

		const childEpics = epics.filter((e) =>
			e.relationships.some(
				(r) => r.target === milestone.id && r.type === "delivers",
			),
		);

		for (const epic of childEpics) {
			console.log(`  ${formatStatus(epic.status)} ${epic.id}: ${epic.title}`);

			const childTasks = tasks.filter((t) =>
				t.relationships.some(
					(r) => r.target === epic.id && r.type === "delivers",
				),
			);

			for (const task of childTasks) {
				console.log(`    ${formatStatus(task.status)} ${task.id}: ${task.title}`);
			}
		}
		console.log();
	}

	// Show orphan epics (not delivering to any milestone)
	const orphanEpics = epics.filter(
		(e) => !e.relationships.some((r) => r.type === "delivers" && milestones.some((m) => m.id === r.target)),
	);
	if (orphanEpics.length > 0) {
		console.log("Unlinked epics:");
		for (const epic of orphanEpics) {
			console.log(`  ${formatStatus(epic.status)} ${epic.id}: ${epic.title}`);
		}
	}
}

function formatStatus(status: string): string {
	const icons: Record<string, string> = {
		captured: "[.]",
		exploring: "[~]",
		ready: "[R]",
		prioritised: "[P]",
		active: "[*]",
		hold: "[-]",
		blocked: "[!]",
		review: "[?]",
		completed: "[+]",
		surpassed: "[^]",
		archived: "[x]",
		recurring: "[r]",
	};
	return icons[status] ?? `[${status}]`;
}
