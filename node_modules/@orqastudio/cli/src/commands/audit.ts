/**
 * Audit command — full governance audit.
 *
 * orqa audit [--fix]
 *
 * Runs: integrity validation (with optional --fix), version drift, license audit, readme audit.
 * Exits non-zero if any check fails.
 */

import { execSync } from "node:child_process";
import { getRoot } from "../lib/root.js";

export async function runAuditCommand(args: string[] = []): Promise<void> {
	const root = getRoot();
	let failed = false;

	const fix = args.includes("--fix") ? " --fix" : "";

	const checks = [
		{ name: "integrity", cmd: `orqa validate .${fix}` },
		{ name: "version", cmd: "orqa version check" },
		{ name: "license", cmd: "orqa repo license" },
		{ name: "readme", cmd: "orqa repo readme" },
	];

	for (const check of checks) {
		try {
			execSync(check.cmd, { cwd: root, stdio: "inherit" });
		} catch {
			failed = true;
		}
	}

	if (failed) {
		process.exit(1);
	}
}
