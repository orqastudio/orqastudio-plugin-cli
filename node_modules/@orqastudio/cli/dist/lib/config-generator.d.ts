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
/** A single config line from a rule's enforcement entry. */
export interface ConfigEntry {
    [key: string]: unknown;
}
/** A parsed enforcement entry from a rule's frontmatter. */
export interface EnforcementEntry {
    plugin: string;
    tool: string;
    config: ConfigEntry[];
}
/** A tool definition from a plugin's orqa-plugin.json. */
export interface ToolDefinition {
    command: string;
    configFile: string | null;
    configFormat: "json" | "toml" | "ts" | "cli-args";
}
/** Result of config generation for one project. */
export interface GeneratedConfig {
    project: string;
    file: string;
    entries: number;
}
/**
 * Extract enforcement entries from all rules in a directory.
 */
export declare function extractEnforcementEntries(rulesDir: string): EnforcementEntry[];
/**
 * Load tool definitions from installed plugin manifests.
 */
export declare function loadPluginTools(projectRoot: string): Map<string, Map<string, ToolDefinition>>;
/**
 * Generate config files from enforcement entries.
 */
export declare function generateConfigs(projectRoot: string, entries: EnforcementEntry[], pluginTools: Map<string, Map<string, ToolDefinition>>): GeneratedConfig[];
//# sourceMappingURL=config-generator.d.ts.map