/**
 * Plugin installer — download, extract, and manage plugin installations.
 *
 * Plugins are distributed as .tar.gz archives from GitHub Releases.
 * Local path installs are also supported for development.
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
//# sourceMappingURL=installer.d.ts.map