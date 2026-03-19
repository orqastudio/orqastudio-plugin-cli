/**
 * Config generator — reads coding standards rules and generates tool config files.
 *
 * Rules define enforcement entries keyed by plugin and tool. This module
 * reads those entries, merges org-level config with sub-project overrides,
 * and generates the tool config files (e.g. .eslintrc.json, clippy.toml).
 *
 * The generated config files are the OUTPUT of the governance system.
 * Developers edit rules, not config files.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { parse as parseYaml } from "yaml";
/**
 * Extract enforcement entries from all rules in a directory.
 */
export function extractEnforcementEntries(rulesDir) {
    const entries = [];
    if (!fs.existsSync(rulesDir))
        return entries;
    for (const file of fs.readdirSync(rulesDir).filter((f) => f.endsWith(".md"))) {
        const content = fs.readFileSync(path.join(rulesDir, file), "utf-8");
        const lines = content.split("\n");
        if (lines[0]?.trim() !== "---")
            continue;
        let fmEnd = -1;
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === "---") {
                fmEnd = i;
                break;
            }
        }
        if (fmEnd === -1)
            continue;
        const fmText = lines.slice(1, fmEnd).join("\n");
        try {
            const fm = parseYaml(fmText);
            const enforcement = fm["enforcement"];
            if (!Array.isArray(enforcement))
                continue;
            for (const entry of enforcement) {
                const e = entry;
                if (typeof e["plugin"] === "string" && typeof e["tool"] === "string" && Array.isArray(e["config"])) {
                    entries.push({
                        plugin: e["plugin"],
                        tool: e["tool"],
                        config: e["config"],
                    });
                }
            }
        }
        catch { /* skip unparseable */ }
    }
    return entries;
}
/**
 * Load tool definitions from installed plugin manifests.
 */
export function loadPluginTools(projectRoot) {
    const result = new Map();
    const pluginsDir = path.join(projectRoot, "plugins");
    if (!fs.existsSync(pluginsDir))
        return result;
    for (const entry of fs.readdirSync(pluginsDir, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name.startsWith("."))
            continue;
        const manifestPath = path.join(pluginsDir, entry.name, "orqa-plugin.json");
        if (!fs.existsSync(manifestPath))
            continue;
        try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
            const tools = manifest.provides?.tools;
            if (!tools || typeof tools !== "object")
                continue;
            const pluginName = manifest.name;
            const toolMap = new Map();
            for (const [toolKey, toolDef] of Object.entries(tools)) {
                const td = toolDef;
                toolMap.set(toolKey, {
                    command: td["command"],
                    configFile: td["configFile"] ?? null,
                    configFormat: td["configFormat"] ?? "json",
                });
            }
            result.set(pluginName, toolMap);
        }
        catch { /* skip */ }
    }
    return result;
}
/**
 * Generate config files from enforcement entries.
 */
export function generateConfigs(projectRoot, entries, pluginTools) {
    const generated = [];
    // Group entries by plugin + tool
    const grouped = new Map();
    for (const entry of entries) {
        const key = `${entry.plugin}::${entry.tool}`;
        const existing = grouped.get(key) ?? [];
        existing.push(...entry.config);
        grouped.set(key, existing);
    }
    for (const [key, configs] of grouped) {
        const [pluginName, toolName] = key.split("::");
        const toolDef = pluginTools.get(pluginName)?.get(toolName);
        if (!toolDef || !toolDef.configFile)
            continue;
        const configPath = path.join(projectRoot, toolDef.configFile);
        if (toolDef.configFormat === "json") {
            const obj = buildJsonConfig(configs, toolName);
            fs.writeFileSync(configPath, JSON.stringify(obj, null, 2) + "\n");
        }
        else if (toolDef.configFormat === "toml") {
            const toml = buildTomlConfig(configs, toolName);
            fs.writeFileSync(configPath, toml);
        }
        generated.push({
            project: projectRoot,
            file: toolDef.configFile,
            entries: configs.length,
        });
    }
    return generated;
}
function buildJsonConfig(configs, toolName) {
    if (toolName === "eslint") {
        const rules = {};
        for (const c of configs) {
            if (c["rule"] && c["severity"]) {
                rules[c["rule"]] = c["options"]
                    ? [c["severity"], c["options"]]
                    : c["severity"];
            }
        }
        return { rules };
    }
    // Generic JSON config
    const result = {};
    for (const c of configs) {
        Object.assign(result, c);
    }
    return result;
}
function buildTomlConfig(configs, toolName) {
    const lines = [];
    if (toolName === "clippy") {
        lines.push("[lints.clippy]");
        for (const c of configs) {
            if (c["lint"] && c["level"]) {
                lines.push(`${c["lint"]} = "${c["level"]}"`);
            }
        }
    }
    else if (toolName === "rustfmt") {
        for (const c of configs) {
            if (c["key"] && c["value"] !== undefined) {
                const val = typeof c["value"] === "string" ? `"${c["value"]}"` : c["value"];
                lines.push(`${c["key"]} = ${val}`);
            }
        }
    }
    else {
        for (const c of configs) {
            for (const [k, v] of Object.entries(c)) {
                const val = typeof v === "string" ? `"${v}"` : v;
                lines.push(`${k} = ${val}`);
            }
        }
    }
    return lines.join("\n") + "\n";
}
//# sourceMappingURL=config-generator.js.map