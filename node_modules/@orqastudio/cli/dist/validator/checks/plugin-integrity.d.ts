/**
 * Plugin integrity checks — required categories and dependency resolution.
 *
 * These checks operate on the set of installed plugins, not the artifact graph.
 * They are called from validate-schema.ts after all plugin manifests are loaded.
 */
/** Minimal shape of a loaded plugin manifest for integrity checks. */
export interface LoadedPlugin {
    /** Plugin name (e.g. "@orqastudio/plugin-governance"). */
    name: string;
    /** Path to the manifest file, for error reporting. */
    path: string;
    /** Plugin category, if declared. */
    category?: string | null;
    /** Plugin dependencies declared in requires[]. */
    requires?: string[];
}
/** A finding from a plugin integrity check. */
export interface PluginIntegrityFinding {
    severity: "error" | "warning";
    plugin: string;
    message: string;
}
/**
 * Check that at least one installed plugin covers each required category.
 */
export declare function checkRequiredCategories(plugins: LoadedPlugin[]): PluginIntegrityFinding[];
/**
 * Check that all plugin dependencies declared in requires[] are installed.
 */
export declare function checkPluginDependencies(plugins: LoadedPlugin[]): PluginIntegrityFinding[];
//# sourceMappingURL=plugin-integrity.d.ts.map