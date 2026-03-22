/**
 * Plugin integrity checks — required categories and dependency resolution.
 *
 * These checks operate on the set of installed plugins, not the artifact graph.
 * They are called from validate-schema.ts after all plugin manifests are loaded.
 */
/** Categories the app requires at least one plugin to provide. */
const REQUIRED_CATEGORIES = ["thinking", "delivery", "governance"];
/**
 * Check that at least one installed plugin covers each required category.
 */
export function checkRequiredCategories(plugins) {
    const findings = [];
    const installedCategories = new Set(plugins.map((p) => p.category).filter((c) => typeof c === "string"));
    for (const required of REQUIRED_CATEGORIES) {
        if (!installedCategories.has(required)) {
            findings.push({
                severity: "error",
                plugin: "(project)",
                message: `No installed plugin provides category "${required}". The app requires at least one plugin from each of: ${REQUIRED_CATEGORIES.join(", ")}.`,
            });
        }
    }
    return findings;
}
/**
 * Check that all plugin dependencies declared in requires[] are installed.
 */
export function checkPluginDependencies(plugins) {
    const findings = [];
    const installedNames = new Set(plugins.map((p) => p.name));
    for (const plugin of plugins) {
        if (!plugin.requires || plugin.requires.length === 0)
            continue;
        for (const dep of plugin.requires) {
            if (!installedNames.has(dep)) {
                findings.push({
                    severity: "error",
                    plugin: plugin.name,
                    message: `Required plugin "${dep}" is not installed.`,
                });
            }
        }
    }
    return findings;
}
//# sourceMappingURL=plugin-integrity.js.map