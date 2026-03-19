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
export declare function runCheckCommand(args: string[]): Promise<void>;
//# sourceMappingURL=check.d.ts.map