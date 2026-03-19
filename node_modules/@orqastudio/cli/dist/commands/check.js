/**
 * Code quality checks — delegates to plugin-provided tools.
 *
 * orqa check              Run all checks from installed plugins
 * orqa check <tool>       Run a specific tool (eslint, clippy, etc.)
 * orqa check configure    Generate config files from coding standards rules
 *
 * Tools are discovered from installed plugin manifests (orqa-plugin.json).
 * Each plugin declares its tools in the `provides.tools` section.
 */
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { loadPluginTools, extractEnforcementEntries, generateConfigs, } from "../lib/config-generator.js";
import { getRoot } from "../lib/root.js";
const USAGE = `
Usage: orqa check [subcommand]

Run all code quality checks from installed plugins, or target a specific tool:

Subcommands:
  configure     Generate config files from coding standards rules
  <tool-name>   Run a specific tool (e.g. eslint, clippy, svelte-check)

Running 'orqa check' with no subcommand runs all tools from all installed plugins.
`.trim();
export async function runCheckCommand(args) {
    if (args[0] === "--help" || args[0] === "-h") {
        console.log(USAGE);
        return;
    }
    const root = getRoot();
    const target = args[0];
    if (target === "configure") {
        await cmdConfigure(root);
        return;
    }
    // Load plugin tools
    const pluginTools = loadPluginTools(root);
    if (pluginTools.size === 0) {
        console.log("No plugins with tools installed. Install a plugin first (e.g. orqa plugin install @orqastudio/plugin-svelte).");
        return;
    }
    // Collect all tools to run
    const toRun = [];
    for (const [pluginName, tools] of pluginTools) {
        for (const [toolName, tool] of tools) {
            if (target && toolName !== target)
                continue;
            toRun.push({ pluginName, toolName, tool });
        }
    }
    if (target && toRun.length === 0) {
        console.error(`Unknown tool: ${target}`);
        console.error("\nAvailable tools:");
        for (const [pluginName, tools] of pluginTools) {
            for (const toolName of tools.keys()) {
                console.error(`  ${toolName} (from ${pluginName})`);
            }
        }
        process.exit(1);
    }
    let failed = false;
    for (const { pluginName, toolName, tool } of toRun) {
        const projectDir = findProjectDir(root, pluginName);
        if (!projectDir) {
            console.log(`  ${toolName} (${pluginName}) — skipped, no matching project found`);
            continue;
        }
        console.log(`  ${toolName} (${pluginName}) in ${path.relative(root, projectDir)}...`);
        try {
            execSync(tool.command, { cwd: projectDir, stdio: "inherit" });
        }
        catch {
            failed = true;
        }
    }
    if (failed) {
        process.exit(1);
    }
}
async function cmdConfigure(root) {
    console.log("Generating config files from coding standards rules...\n");
    const pluginTools = loadPluginTools(root);
    const entries = [
        ...extractEnforcementEntries(path.join(root, ".orqa/process/rules")),
        ...extractEnforcementEntries(path.join(root, "app/.orqa/process/rules")),
    ];
    if (entries.length === 0) {
        console.log("No enforcement entries found in coding standards rules.");
        console.log("Add enforcement entries to rules in .orqa/process/rules/ with plugin/tool/config.");
        return;
    }
    const generated = generateConfigs(root, entries, pluginTools);
    if (generated.length === 0) {
        console.log("No matching plugin tools installed for the enforcement entries.");
        return;
    }
    for (const g of generated) {
        console.log(`  ${g.file} — ${g.entries} entries`);
    }
    console.log(`\nGenerated ${generated.length} config file(s).`);
}
/**
 * Find the project directory where a plugin's tools should run.
 */
function findProjectDir(root, pluginName) {
    if (pluginName.includes("svelte") || pluginName.includes("typescript")) {
        const appUi = path.join(root, "app/ui");
        if (fs.existsSync(path.join(appUi, "package.json")))
            return appUi;
        if (fs.existsSync(path.join(root, "package.json")))
            return root;
    }
    if (pluginName.includes("tauri") || pluginName.includes("rust")) {
        const srcTauri = path.join(root, "app/backend/src-tauri");
        if (fs.existsSync(path.join(srcTauri, "Cargo.toml")))
            return srcTauri;
    }
    return fs.existsSync(root) ? root : null;
}
//# sourceMappingURL=check.js.map