/**
 * Plugin lockfile — tracks installed plugin versions and integrity hashes.
 *
 * Located at `plugins.lock.json` in the project root.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { PluginLockEntry } from "@orqastudio/types";

export interface LockfileData {
	version: 1;
	plugins: PluginLockEntry[];
}

const LOCKFILE_NAME = "plugins.lock.json";

/**
 * Read the lockfile from the project root.
 * Returns an empty lockfile if the file doesn't exist.
 */
export function readLockfile(projectRoot: string): LockfileData {
	const lockfilePath = path.join(projectRoot, LOCKFILE_NAME);

	if (!fs.existsSync(lockfilePath)) {
		return { version: 1, plugins: [] };
	}

	const contents = fs.readFileSync(lockfilePath, "utf-8");
	return JSON.parse(contents) as LockfileData;
}

/**
 * Write the lockfile to the project root.
 */
export function writeLockfile(projectRoot: string, data: LockfileData): void {
	const lockfilePath = path.join(projectRoot, LOCKFILE_NAME);
	fs.writeFileSync(lockfilePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}
