/**
 * Injector-config generator — aggregates plugin hook injection contributions.
 *
 * Scans plugins/ and connectors/ for behavioral_rules, mode_templates, and
 * session_reminders declared in orqa-plugin.json manifests. Writes the
 * aggregated result to .orqa/connectors/claude-code/injector-config.json
 * so the prompt-injector can merge plugin contributions without rescanning
 * on every hook invocation.
 */
export interface InjectorConfig {
    /** ISO 8601 timestamp of when this config was generated. */
    generated: string;
    /** Space-joined behavioral rules from all plugins. */
    behavioral_rules: string;
    /** Merged mode templates from all plugins. Built-ins win on collision. */
    mode_templates: Record<string, string>;
    /** Space-joined session reminders from all plugins. */
    session_reminders: string;
}
/**
 * Scan all plugin manifests in plugins/ and connectors/ and aggregate
 * their behavioral_rules, mode_templates, and session_reminders.
 *
 * Returns the aggregated config without writing to disk.
 */
export declare function aggregateInjectorConfig(projectRoot: string): InjectorConfig;
/**
 * Generate the injector config and write it to
 * .orqa/connectors/claude-code/injector-config.json.
 *
 * Creates the directory if it does not exist.
 * Returns the written config.
 */
export declare function generateInjectorConfig(projectRoot: string): InjectorConfig;
//# sourceMappingURL=injector-config.d.ts.map