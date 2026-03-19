/**
 * Resolve the OrqaStudio project root directory.
 *
 * Resolution order:
 * 1. ORQA_ROOT environment variable (explicit override)
 * 2. Walk up from cwd looking for .orqa/ directory (project detection)
 * 3. Fall back to cwd
 */
import * as path from "node:path";
import * as fs from "node:fs";
let cachedRoot = null;
export function getRoot() {
    if (cachedRoot)
        return cachedRoot;
    // 1. Environment variable
    const envRoot = process.env.ORQA_ROOT;
    if (envRoot && fs.existsSync(path.resolve(envRoot))) {
        cachedRoot = path.resolve(envRoot);
        return cachedRoot;
    }
    // 2. Walk up from cwd looking for .orqa/ directory
    let dir = process.cwd();
    const { root: fsRoot } = path.parse(dir);
    while (dir !== fsRoot) {
        if (fs.existsSync(path.join(dir, ".orqa"))) {
            cachedRoot = dir;
            return cachedRoot;
        }
        const parent = path.dirname(dir);
        if (parent === dir)
            break;
        dir = parent;
    }
    // 3. Fall back to cwd
    cachedRoot = process.cwd();
    return cachedRoot;
}
//# sourceMappingURL=root.js.map