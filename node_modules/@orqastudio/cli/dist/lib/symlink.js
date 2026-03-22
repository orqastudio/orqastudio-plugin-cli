/**
 * Cross-platform symlink utility.
 *
 * On Windows, symlinks require either Developer Mode or elevated privileges.
 * We use PowerShell's New-Item to create NTFS symbolic links, which works
 * under Developer Mode without elevation.
 *
 * On Unix, we use the standard fs.symlinkSync with "dir" or "file" type.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
/**
 * Detect whether the resolved target path is a directory.
 * Falls back to false if the target does not exist yet.
 */
function detectIsDirectory(resolvedTarget) {
    try {
        return fs.statSync(resolvedTarget).isDirectory();
    }
    catch {
        return false;
    }
}
/**
 * Create a symlink. Cross-platform: uses PowerShell on Windows, fs.symlinkSync on Unix.
 * Handles file vs directory detection automatically from the resolved target path.
 *
 * @param target - The target path (may be relative to linkPath's directory, or absolute).
 * @param linkPath - The path where the symlink will be created.
 */
export function createSymlink(target, linkPath) {
    const absTarget = path.isAbsolute(target)
        ? target
        : path.resolve(path.dirname(linkPath), target);
    if (process.platform === "win32") {
        // Escape single quotes in paths for PowerShell safety
        const safeLinkPath = linkPath.replace(/'/g, "''");
        const safeAbsTarget = absTarget.replace(/'/g, "''");
        execSync(`powershell -Command "New-Item -ItemType SymbolicLink -Path '${safeLinkPath}' -Target '${safeAbsTarget}' -Force"`, { stdio: "pipe" });
    }
    else {
        const isDir = detectIsDirectory(absTarget);
        fs.symlinkSync(target, linkPath, isDir ? "dir" : "file");
    }
}
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
export function ensureSymlink(target, linkPath, options = {}) {
    // Resolve target to verify it exists
    const absTarget = path.isAbsolute(target)
        ? target
        : path.resolve(path.dirname(path.resolve(linkPath)), target);
    if (!fs.existsSync(absTarget)) {
        return {
            status: "skipped",
            target,
            linkPath,
            error: `Target does not exist: ${absTarget}`,
        };
    }
    // Ensure parent directory of linkPath exists
    const parentDir = path.dirname(path.resolve(linkPath));
    if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
    }
    try {
        const stat = fs.lstatSync(linkPath);
        if (stat.isSymbolicLink()) {
            const current = fs.readlinkSync(linkPath);
            if (current === target) {
                return { status: "exists", target, linkPath };
            }
            // Stale symlink — remove and recreate
            fs.unlinkSync(linkPath);
            createSymlink(target, linkPath);
            return { status: "replaced", target, linkPath };
        }
        // Regular file or directory
        if (options.force === true) {
            if (stat.isDirectory()) {
                fs.rmSync(linkPath, { recursive: true });
            }
            else {
                fs.unlinkSync(linkPath);
            }
            createSymlink(target, linkPath);
            return { status: "replaced", target, linkPath };
        }
        return {
            status: "skipped",
            target,
            linkPath,
            error: `${linkPath} exists as a real file/directory; use --force to replace`,
        };
    }
    catch (err) {
        // lstatSync threw — path does not exist
        const nodeErr = err;
        if (nodeErr.code === "ENOENT") {
            createSymlink(target, linkPath);
            return { status: "created", target, linkPath };
        }
        throw err;
    }
}
/**
 * Verify a symlink is valid: exists, is a symlink, and its target is reachable.
 *
 * @param linkPath - The path to verify.
 */
export function verifySymlink(linkPath) {
    let symlinkTarget;
    try {
        const stat = fs.lstatSync(linkPath);
        if (!stat.isSymbolicLink()) {
            return {
                valid: false,
                linkPath,
                error: `${linkPath} exists but is not a symlink`,
            };
        }
        symlinkTarget = fs.readlinkSync(linkPath);
    }
    catch {
        return {
            valid: false,
            linkPath,
            error: `${linkPath} does not exist`,
        };
    }
    // Resolve the target relative to the symlink's directory and check it exists
    const resolvedTarget = path.isAbsolute(symlinkTarget)
        ? symlinkTarget
        : path.resolve(path.dirname(linkPath), symlinkTarget);
    try {
        const stat = fs.statSync(resolvedTarget);
        return {
            valid: true,
            linkPath,
            target: symlinkTarget,
            resolvedTarget,
            isDirectory: stat.isDirectory(),
        };
    }
    catch {
        return {
            valid: false,
            linkPath,
            target: symlinkTarget,
            resolvedTarget,
            error: `Target does not exist: ${resolvedTarget}`,
        };
    }
}
/**
 * Remove a symlink. No-op if the path is not a symlink (safety — never deletes regular files).
 *
 * @param linkPath - The symlink path to remove.
 * @returns true if removed, false if not a symlink or not found.
 */
export function removeSymlink(linkPath) {
    try {
        const stat = fs.lstatSync(linkPath);
        if (!stat.isSymbolicLink()) {
            return false;
        }
        fs.unlinkSync(linkPath);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=symlink.js.map