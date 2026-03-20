/**
 * Validation command — uses the built-in integrity validator.
 *
 * orqa validate [path] [--json] [--fix]
 */

import { buildGraph } from "../validator/graph.js";
import { buildCheckContext, runChecksWithSummary } from "../validator/checker.js";
import { applyFixes } from "../validator/fixer.js";
import { runValidateSchemaCommand } from "./validate-schema.js";

const USAGE = `
Usage: orqa validate [subcommand|path] [options]

Run integrity validation on the specified path (defaults to current directory).

Subcommands:
  schema              Validate project.json and plugin manifests against schemas

Options:
  --fix               Auto-fix objectively fixable errors (e.g. missing inverses)
  --json              Output results as JSON
  --help, -h          Show this help message
`.trim();

export async function runValidateCommand(args: string[]): Promise<void> {
	if (args.includes("--help") || args.includes("-h")) {
		console.log(USAGE);
		return;
	}

	// Subcommand dispatch
	if (args[0] === "schema") {
		await runValidateSchemaCommand(args.slice(1));
		return;
	}

	const jsonOutput = args.includes("--json");
	const autoFix = args.includes("--fix");
	const targetPath = args.find((a) => !a.startsWith("--")) ?? process.cwd();

	const graph = buildGraph({ projectRoot: targetPath });
	const ctx = buildCheckContext(targetPath);
	let summary = runChecksWithSummary(graph, ctx);

	// Auto-fix pass
	if (autoFix && summary.findings.some((f) => f.autoFixable)) {
		const fixSummary = applyFixes(summary.findings, graph, ctx, targetPath);

		if (fixSummary.applied > 0) {
			if (!jsonOutput) {
				console.log(`Auto-fixed ${fixSummary.applied} issue(s).`);
				if (fixSummary.failed > 0) {
					console.log(`  ${fixSummary.failed} fix(es) failed.`);
				}
			}

			// Re-run checks on the fixed graph
			const rebuiltGraph = buildGraph({ projectRoot: targetPath });
			summary = runChecksWithSummary(rebuiltGraph, ctx);
		}
	}

	if (jsonOutput) {
		console.log(JSON.stringify(summary, null, 2));
	} else {
		const { errors, warnings, totalFindings } = summary;

		if (totalFindings === 0) {
			console.log("Integrity check passed. 0 errors, 0 warnings.");
		} else {
			// Group by category
			const byCategory = new Map<string, typeof summary.findings>();
			for (const f of summary.findings) {
				const list = byCategory.get(f.category) ?? [];
				list.push(f);
				byCategory.set(f.category, list);
			}

			for (const [category, findings] of byCategory) {
				console.log(`\n${category} (${findings.length}):`);
				for (const f of findings) {
					const icon = f.severity === "error" ? "E" : "W";
					console.log(`  [${icon}] ${f.artifactId}: ${f.message}`);
				}
			}

			console.log(`\n${errors} error(s), ${warnings} warning(s).`);

			if (errors > 0) process.exit(1);
		}
	}
}
