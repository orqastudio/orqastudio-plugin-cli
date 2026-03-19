/**
 * Setup commands — dev environment bootstrapping.
 *
 * orqa setup link  — Install deps, build libs, and npm link everything
 */
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { getRoot } from "../lib/root.js";
const USAGE = `
Usage: orqa setup <subcommand>

Subcommands:
  link    Install deps, build all libs, and npm link into the app

Options:
  --help, -h    Show this help message
`.trim();
/**
 * Build order: each entry lists the dir, its @orqastudio deps, and the build command.
 * Order matters — packages must be built before their dependents.
 * `link: true` means this package should be registered globally via `npm link`
 * so other packages can link to it.
 */
const BUILD_ORDER = [
    // Layer 1: no @orqastudio deps
    { dir: "libs/types", deps: [], build: "npx tsc", link: true },
    // Layer 2: depends on types
    { dir: "libs/cli", deps: ["@orqastudio/types"], build: "npx tsc", link: true },
    { dir: "libs/sdk", deps: ["@orqastudio/types"], build: "npx tsc", link: true },
    {
        dir: "libs/svelte-components",
        deps: ["@orqastudio/types", "@orqastudio/sdk"],
        build: "npm run build",
        link: true,
    },
    {
        dir: "libs/graph-visualiser",
        deps: ["@orqastudio/types"],
        build: "npm run build",
        link: true,
    },
    // Layer 3: depends on libs
    {
        dir: "connectors/claude-code",
        deps: ["@orqastudio/types", "@orqastudio/cli"],
        build: "npx tsc",
        link: true,
    },
    // Layer 4: plugins (install deps + link, build if needed)
    { dir: "plugins/software", deps: ["@orqastudio/types", "@orqastudio/sdk", "@orqastudio/svelte-components"], build: "npm run build", link: false },
    { dir: "plugins/claude", deps: ["@orqastudio/claude-code-cli"], build: "", link: false },
    { dir: "plugins/cli", deps: ["@orqastudio/cli", "@orqastudio/types"], build: "", link: false },
    { dir: "plugins/svelte", deps: ["@orqastudio/types"], build: "", link: false },
    { dir: "plugins/tauri", deps: [], build: "", link: false },
];
export async function runSetupCommand(args) {
    const subcommand = args[0];
    if (!subcommand || subcommand === "--help" || subcommand === "-h") {
        console.log(USAGE);
        return;
    }
    switch (subcommand) {
        case "link":
            await cmdLink();
            break;
        default:
            console.error(`Unknown subcommand: ${subcommand}`);
            console.error(USAGE);
            process.exit(1);
    }
}
function run(cmd, cwd) {
    execSync(cmd, { cwd, stdio: "inherit" });
}
async function cmdLink() {
    const root = getRoot();
    console.log("=== OrqaStudio Dev Environment Setup ===");
    console.log(`Root: ${root}`);
    // Build and link each package in dependency order
    for (const entry of BUILD_ORDER) {
        const dir = path.join(root, entry.dir);
        if (!fs.existsSync(dir)) {
            console.log(`\nSkipping ${entry.dir} (not found)`);
            continue;
        }
        const pkgJsonPath = path.join(dir, "package.json");
        if (!fs.existsSync(pkgJsonPath)) {
            console.log(`\nSkipping ${entry.dir} (no package.json)`);
            continue;
        }
        console.log(`\n--- ${entry.dir} ---`);
        // Step 1: npm install — gets deps from GitHub Packages registry
        run("npm install", dir);
        // Step 2: Link @orqastudio deps from local builds (overrides registry versions)
        if (entry.deps.length > 0) {
            run(`npm link ${entry.deps.join(" ")}`, dir);
        }
        // Step 3: Build
        if (entry.build) {
            run(entry.build, dir);
        }
        // Step 4: Register globally so dependents can link to us
        if (entry.link) {
            run("npm link", dir);
        }
    }
    // Link everything into the app
    const appUi = path.join(root, "app/ui");
    if (fs.existsSync(appUi)) {
        console.log("\n--- app/ui ---");
        run("npm install", appUi);
        const allLibs = BUILD_ORDER.filter((e) => e.link).map((e) => {
            const pkgPath = path.join(root, e.dir, "package.json");
            try {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
                return pkg.name;
            }
            catch {
                return null;
            }
        }).filter(Boolean);
        if (allLibs.length > 0) {
            run(`npm link ${allLibs.join(" ")}`, appUi);
        }
        run("npx svelte-kit sync", appUi);
        console.log("\n--- app/ui build ---");
        run("npm run build", appUi);
    }
    // Install brand lib deps (for icon generation)
    const brandDir = path.join(root, "libs/brand");
    if (fs.existsSync(path.join(brandDir, "package.json"))) {
        console.log("\n--- libs/brand ---");
        run("npm install", brandDir);
    }
    console.log("\n=== Done. All libs linked into app. ===");
}
//# sourceMappingURL=setup.js.map