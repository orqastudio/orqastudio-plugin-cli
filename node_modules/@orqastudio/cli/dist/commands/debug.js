/**
 * Debug command — wraps the debug-tool submodule.
 *
 * orqa debug [command]
 */
import { execSync } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";
import { getRoot } from "../lib/root.js";
const USAGE = `
Usage: orqa debug [command]

Run the OrqaStudio debug tool.

Options:
  --help, -h   Show this help message
`.trim();
export async function runDebugCommand(args) {
    if (args.includes("--help") || args.includes("-h")) {
        console.log(USAGE);
        return;
    }
    // Look for debug-tool in the expected location
    const debugToolPaths = [
        path.join(getRoot(), "debug-tool", "debug-tool.sh"),
        path.join(getRoot(), "node_modules", ".bin", "orqa-debug"),
    ];
    let debugToolPath = null;
    for (const p of debugToolPaths) {
        if (fs.existsSync(p)) {
            debugToolPath = p;
            break;
        }
    }
    if (!debugToolPath) {
        console.error("Debug tool not found. Ensure debug-tool submodule is initialized.");
        process.exit(1);
    }
    const cmd = `"${debugToolPath}" ${args.join(" ")}`;
    try {
        execSync(cmd, { encoding: "utf-8", stdio: "inherit" });
    }
    catch {
        process.exit(1);
    }
}
//# sourceMappingURL=debug.js.map