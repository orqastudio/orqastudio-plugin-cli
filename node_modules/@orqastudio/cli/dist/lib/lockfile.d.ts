/**
 * Plugin lockfile — tracks installed plugin versions and integrity hashes.
 *
 * Located at `plugins.lock.json` in the project root.
 */
import type { PluginLockEntry } from "@orqastudio/types";
export interface LockfileData {
    version: 1;
    plugins: PluginLockEntry[];
}
/**
 * Read the lockfile from the project root.
 * Returns an empty lockfile if the file doesn't exist.
 */
export declare function readLockfile(projectRoot: string): LockfileData;
/**
 * Write the lockfile to the project root.
 */
export declare function writeLockfile(projectRoot: string, data: LockfileData): void;
//# sourceMappingURL=lockfile.d.ts.map