/**
 * orqa link — cross-platform symlink management.
 *
 * Usage:
 *   orqa link <target> <link-path>    Create a cross-platform symlink (target first, like ln -s)
 *   orqa link verify <link-path>      Verify a symlink is valid
 *   orqa link remove <link-path>      Remove a symlink (safety: only removes symlinks)
 *   orqa link status                  Show all symlinks in .claude/
 *
 * Options:
 *   --force, -f    Replace existing files (not just stale symlinks)
 *   --absolute     Store target as absolute path (default: relative)
 *   --relative     Store target as relative path (default)
 */
import { ensureSymlink, verifySymlink, removeSymlink } from "../lib/symlink.js";
export declare function runLinkCommand(args: string[]): Promise<void>;
export { ensureSymlink, verifySymlink, removeSymlink };
//# sourceMappingURL=link.d.ts.map