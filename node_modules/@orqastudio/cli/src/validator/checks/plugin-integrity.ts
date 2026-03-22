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

/** Categories the app requires at least one plugin to provide. */
const REQUIRED_CATEGORIES = ["thinking", "delivery", "governance"] as const;

/**
 * Check that at least one installed plugin covers each required category.
 */
export function checkRequiredCategories(plugins: LoadedPlugin[]): PluginIntegrityFinding[] {
	const findings: PluginIntegrityFinding[] = [];
	const installedCategories = new Set(
		plugins.map((p) => p.category).filter((c): c is string => typeof c === "string"),
	);

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
export function checkPluginDependencies(plugins: LoadedPlugin[]): PluginIntegrityFinding[] {
	const findings: PluginIntegrityFinding[] = [];
	const installedNames = new Set(plugins.map((p) => p.name));

	for (const plugin of plugins) {
		if (!plugin.requires || plugin.requires.length === 0) continue;

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
