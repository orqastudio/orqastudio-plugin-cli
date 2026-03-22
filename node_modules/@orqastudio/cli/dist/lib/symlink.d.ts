/**
 * Cross-platform symlink utility.
 *
 * On Windows, symlinks require either Developer Mode or elevated privileges.
 * We use PowerShell's New-Item to create NTFS symbolic links, which works
 * under Developer Mode without elevation.
 *
 * On Unix, we use the standard fs.symlinkSync with "dir" or "file" type.
 */
export interface SymlinkOptions {
    /** Replace existing regular files (not just stale symlinks). Default: false. */
    force?: boolean;
}
export interface SymlinkResult {
    status: "created" | "exists" | "replaced" | "skipped";
    target: string;
    linkPath: string;
    error?: string;
}
export interface SymlinkVerification {
    valid: boolean;
    linkPath: string;
    target?: string;
    resolvedTarget?: string;
    isDirectory?: boolean;
    error?: string;
}
/**
 * Create a symlink. Cross-platform: uses PowerShell on Windows, fs.symlinkSync on Unix.
 * Handles file vs directory detection automatically from the resolved target path.
 *
 * @param target - The target path (may be relative to linkPath's directory, or absolute).
 * @param linkPath - The path where the symlink will be created.
 */
export declare function createSymlink(target: string, linkPath: string): void;
/**
 * Ensure a symlink exists and points to the correct target.
 *
 * Behaviour:
 * - Missing: create it → status "created"
 * - Correct symlink already exists: leave it → status "exists"
 * - Stale symlink (wrong target): replace it → status "replaced"
 * - Regular file/directory: leave it unless force is true → status "skipped" or "replaced"
 * - Target does not exist: skip → status "skipped" with error
 *
 * @param target - The target path (may be relative to linkPath's directory, or absolute).
 * @param linkPath - The path where the symlink should exist.
 * @param options - Optional: force replace even regular files.
 */
export declare function ensureSymlink(target: string, linkPath: string, options?: SymlinkOptions): SymlinkResult;
/**
 * Verify a symlink is valid: exists, is a symlink, and its target is reachable.
 *
 * @param linkPath - The path to verify.
 */
export declare function verifySymlink(linkPath: string): SymlinkVerification;
/**
 * Remove a symlink. No-op if the path is not a symlink (safety — never deletes regular files).
 *
 * @param linkPath - The symlink path to remove.
 * @returns true if removed, false if not a symlink or not found.
 */
export declare function removeSymlink(linkPath: string): boolean;
//# sourceMappingURL=symlink.d.ts.map