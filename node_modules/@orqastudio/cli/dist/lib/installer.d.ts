/**
 * Plugin installer — download, extract, and manage plugin installations.
 *
 * Plugins are distributed as .tar.gz archives from GitHub Releases.
 * Local path installs are also supported for development.
 *
 * Post-install setup (runPostInstallSetup):
 * - Creates .claude/agents → .orqa/process/agents/ symlink
 * - Creates .claude/rules → .orqa/process/rules/ symlink
 * - Aggregates lspServers/mcpServers from all plugin manifests → .lsp.json/.mcp.json
 * NOTE: .claude/CLAUDE.md is NOT managed here — it is a Claude Code project artifact
 * maintained directly, not derived from any source file.
 */
export interface InstallOptions {
    /** GitHub owner/repo or local filesystem path. */
    source: string;
    /** Specific version tag (e.g. "v0.2.0"). Defaults to latest release. */
    version?: string;
    /** Project root directory (defaults to cwd). */
    projectRoot?: string;
}
export interface InstallResult {
    name: string;
    version: string;
    path: string;
    source: "github" | "local";
    /** Key collisions detected during installation. Empty when none. */
    collisions: KeyCollisionResult[];
}
export interface KeyCollisionResult {
    key: string;
    existingSource: string;
    existingDescription: string;
    existingSemantic?: string;
    existingFrom: string[];
    existingTo: string[];
    incomingDescription: string;
    incomingSemantic?: string;
    incomingFrom: string[];
    incomingTo: string[];
    semanticMatch: boolean;
}
/**
 * Install a plugin from a GitHub release archive or local path.
 */
export declare function installPlugin(options: InstallOptions): Promise<InstallResult>;
/**
 * Uninstall a plugin by name.
 */
export declare function uninstallPlugin(name: string, projectRoot?: string): void;
/**
 * List all installed plugins by scanning the plugins/ directory.
 */
export declare function listInstalledPlugins(projectRoot?: string): InstallResult[];
export interface PostInstallResult {
    symlinkAgents: "created" | "skipped" | "exists";
    symlinkRules: "created" | "skipped" | "exists";
    lspCount: number;
    mcpCount: number;
}
/**
 * Run post-install setup for the Claude Code connector:
 * 1. Create .claude/agents → .orqa/process/agents/ symlink
 * 2. Create .claude/rules → .orqa/process/rules/ symlink
 * 3. Aggregate lspServers/mcpServers from all plugins/connectors → .lsp.json/.mcp.json
 *    written into the connector's plugin directory.
 *
 * Called automatically by installPlugin when the installed plugin is the Claude Code connector.
 * Can also be called standalone to repair a broken install.
 *
 * NOTE: .claude/CLAUDE.md is NOT managed here — it is a Claude Code project artifact
 * maintained directly.
 */
export declare function runPostInstallSetup(projectRoot: string, connectorPluginDir: string): PostInstallResult;
//# sourceMappingURL=installer.d.ts.map