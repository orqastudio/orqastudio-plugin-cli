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
import * as fs from "node:fs";
import * as path from "node:path";
import { ensureSymlink, verifySymlink, removeSymlink, } from "../lib/symlink.js";
const LINK_USAGE = `
orqa link — cross-platform symlink management

Usage:
  orqa link <target> <link-path>    Create a cross-platform symlink (target first, like ln -s)
  orqa link verify <link-path>      Verify a symlink is valid
  orqa link remove <link-path>      Remove a symlink (safety: only removes symlinks)
  orqa link status [dir]            Show all symlinks in a directory (default: .claude/)

Options:
  --force, -f    Replace existing files (not just stale symlinks)
  --absolute     Store target as absolute path (default: relative)
  --relative     Store target as relative path (same as omitting --absolute)

Examples:
  orqa link app/.orqa/process/agents/orchestrator.md .claude/CLAUDE.md --force
  orqa link .orqa/process/rules .claude/rules --force
  orqa link verify .claude/CLAUDE.md
  orqa link remove .claude/rules
  orqa link status
`.trim();
export async function runLinkCommand(args) {
    if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
        console.log(LINK_USAGE);
        return;
    }
    const subcommand = args[0];
    switch (subcommand) {
        case "verify":
            runVerifySubcommand(args.slice(1));
            break;
        case "remove":
            runRemoveSubcommand(args.slice(1));
            break;
        case "status":
            runStatusSubcommand(args.slice(1));
            break;
        default:
            // Treat as: orqa link <target> <link-path> [options]
            runCreateSubcommand(args);
            break;
    }
}
// ---------------------------------------------------------------------------
// Subcommands
// ---------------------------------------------------------------------------
function runCreateSubcommand(args) {
    const { positional, flags } = parseArgs(args);
    if (positional.length < 2) {
        console.error("Error: 'orqa link' requires <target> and <link-path> arguments.");
        console.error("Run 'orqa link --help' for usage.");
        process.exit(1);
    }
    const [rawTarget, rawLinkPath] = positional;
    // positional[0] and [1] are guaranteed by the length check above
    const target = rawTarget;
    const linkPath = rawLinkPath;
    const options = { force: flags.force };
    // Resolve whether to store as relative or absolute
    const resolvedLinkPath = path.resolve(linkPath);
    let resolvedTarget;
    if (flags.absolute) {
        resolvedTarget = path.resolve(target);
    }
    else {
        // Relative is the default — compute relative path from linkPath's directory to target
        const targetAbs = path.resolve(target);
        resolvedTarget = path.relative(path.dirname(resolvedLinkPath), targetAbs);
    }
    const result = ensureSymlink(resolvedTarget, resolvedLinkPath, options);
    switch (result.status) {
        case "created":
            console.log(`\u2192 created: ${linkPath} \u2192 ${resolvedTarget}`);
            break;
        case "exists":
            console.log(`\u2192 exists: ${linkPath} \u2192 ${resolvedTarget}`);
            break;
        case "replaced":
            console.log(`\u2192 replaced: ${linkPath} \u2192 ${resolvedTarget}`);
            break;
        case "skipped":
            if (result.error) {
                console.error(`\u2192 skipped: ${result.error}`);
            }
            else {
                console.log(`\u2192 skipped: ${linkPath} (use --force to replace existing file)`);
            }
            break;
    }
}
function runVerifySubcommand(args) {
    const { positional } = parseArgs(args);
    if (positional.length === 0) {
        console.error("Error: 'orqa link verify' requires a <link-path> argument.");
        console.error("Run 'orqa link --help' for usage.");
        process.exit(1);
    }
    const linkPath = positional[0];
    const result = verifySymlink(linkPath);
    if (result.valid) {
        const kind = result.isDirectory === true ? "directory" : "file";
        console.log(`\u2192 valid: ${linkPath} \u2192 ${result.target} (${kind})`);
    }
    else {
        console.error(`\u2192 broken: ${result.error}`);
        process.exit(1);
    }
}
function runRemoveSubcommand(args) {
    const { positional } = parseArgs(args);
    if (positional.length === 0) {
        console.error("Error: 'orqa link remove' requires a <link-path> argument.");
        console.error("Run 'orqa link --help' for usage.");
        process.exit(1);
    }
    const linkPath = positional[0];
    const removed = removeSymlink(linkPath);
    if (removed) {
        console.log(`\u2192 removed: ${linkPath}`);
    }
    else {
        // Check if the path exists at all
        try {
            fs.lstatSync(linkPath);
            console.error(`Error: ${linkPath} exists but is not a symlink — refusing to remove.`);
        }
        catch {
            console.error(`Error: ${linkPath} does not exist.`);
        }
        process.exit(1);
    }
}
function runStatusSubcommand(args) {
    const { positional } = parseArgs(args);
    // Allow an optional directory argument; default to .claude/
    const scanDir = positional[0] ?? path.join(process.cwd(), ".claude");
    const resolvedDir = path.resolve(scanDir);
    if (!fs.existsSync(resolvedDir)) {
        console.log(`No directory found at: ${resolvedDir}`);
        return;
    }
    const symlinks = collectSymlinks(resolvedDir);
    if (symlinks.length === 0) {
        console.log(`No symlinks found in: ${resolvedDir}`);
        return;
    }
    console.log(`Symlinks in ${resolvedDir}:\n`);
    let valid = 0;
    let invalid = 0;
    for (const symlinkPath of symlinks) {
        const result = verifySymlink(symlinkPath);
        const rel = path.relative(resolvedDir, symlinkPath);
        if (result.valid) {
            console.log(`  \u2192 valid: ${rel} \u2192 ${result.target}`);
            valid++;
        }
        else {
            console.log(`  \u2192 broken: ${rel}: ${result.error}`);
            invalid++;
        }
    }
    console.log(`\n${valid} valid, ${invalid} broken`);
    if (invalid > 0) {
        process.exit(1);
    }
}
function parseArgs(args) {
    const positional = [];
    const flags = { force: false, absolute: false, relative: false };
    for (const arg of args) {
        if (arg === "--force" || arg === "-f") {
            flags.force = true;
        }
        else if (arg === "--absolute") {
            flags.absolute = true;
        }
        else if (arg === "--relative") {
            flags.relative = true;
        }
        else if (!arg.startsWith("-")) {
            positional.push(arg);
        }
        // Unknown flags are silently ignored for forward compatibility
    }
    return { positional, flags };
}
/**
 * Recursively collect all symlinks under a directory.
 */
function collectSymlinks(dir) {
    const results = [];
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    }
    catch {
        return results;
    }
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isSymbolicLink()) {
            results.push(fullPath);
        }
        else if (entry.isDirectory()) {
            results.push(...collectSymlinks(fullPath));
        }
    }
    return results;
}
// Re-export the underlying utilities so the command module doubles as a thin
// programmatic wrapper that callers can import if preferred.
export { ensureSymlink, verifySymlink, removeSymlink };
//# sourceMappingURL=link.js.map