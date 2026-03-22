/**
 * Plugin installer — download, extract, and manage plugin installations.
 *
 * Plugins are distributed as .tar.gz archives from GitHub Releases.
 * Local path installs are also supported for development.
 *
 * Post-install hooks: callers pass an optional `postInstall` callback in InstallOptions.
 * Connector-specific setup (e.g. .claude/ wiring) lives in the connector package,
 * not here. The CLI installer is platform-agnostic.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { readLockfile, writeLockfile } from "./lockfile.js";
import { readManifest, validateManifest } from "./manifest.js";
import { PLATFORM_CONFIG } from "@orqastudio/types";
/**
 * Detect relationship key collisions between an incoming plugin and
 * existing definitions (core.json + already-installed plugins).
 */
function detectCollisions(manifest, projectRoot) {
    const collisions = [];
    // Build existing relationship map: key → { source, rel }
    const existing = [];
    // Core relationships
    for (const rel of PLATFORM_CONFIG.relationships) {
        existing.push({ source: "core", rel });
    }
    // Already-installed plugin relationships
    const dir = path.join(projectRoot, "plugins");
    if (fs.existsSync(dir)) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (!entry.isDirectory() || entry.name.startsWith("."))
                continue;
            try {
                const installed = readManifest(path.join(dir, entry.name));
                if (installed.name === manifest.name)
                    continue; // Skip self
                for (const rel of installed.provides.relationships) {
                    existing.push({ source: installed.name, rel });
                }
            }
            catch { /* skip invalid */ }
        }
    }
    // Check incoming relationships against existing
    for (const incoming of manifest.provides.relationships) {
        const match = existing.find((e) => e.rel.key === incoming.key);
        if (match) {
            collisions.push({
                key: incoming.key,
                existingSource: match.source,
                existingDescription: match.rel.description ?? "",
                existingSemantic: match.rel.semantic,
                existingFrom: match.rel.from ?? [],
                existingTo: match.rel.to ?? [],
                incomingDescription: incoming.description ?? "",
                incomingSemantic: incoming.semantic,
                incomingFrom: incoming.from ?? [],
                incomingTo: incoming.to ?? [],
                semanticMatch: match.rel.semantic === incoming.semantic,
            });
        }
    }
    return collisions;
}
/** Resolve the plugins directory for a project. */
function pluginsDir(projectRoot) {
    return path.join(projectRoot, "plugins");
}
/**
 * Install a plugin from a GitHub release archive or local path.
 */
export async function installPlugin(options) {
    const root = options.projectRoot ?? process.cwd();
    const dir = pluginsDir(root);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    // Detect source type
    if (fs.existsSync(options.source)) {
        return installFromLocalPath(options.source, dir, options.postInstall);
    }
    // GitHub owner/repo format
    if (options.source.includes("/") && !options.source.includes(path.sep)) {
        return installFromGitHub(options.source, options.version, dir, root, options.postInstall);
    }
    throw new Error(`Invalid source: ${options.source}. Use owner/repo for GitHub or a local path.`);
}
async function installFromLocalPath(source, pluginsDirectory, postInstall) {
    const projectRoot = path.dirname(pluginsDirectory);
    const manifest = readManifest(source);
    const errors = validateManifest(manifest);
    if (errors.length > 0) {
        throw new Error(`Invalid plugin manifest:\n  ${errors.join("\n  ")}`);
    }
    const collisions = detectCollisions(manifest, projectRoot);
    const targetDir = path.join(pluginsDirectory, manifest.name.replace(/^@[^/]+\//, ""));
    if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true });
    }
    fs.cpSync(source, targetDir, { recursive: true });
    postInstall?.(targetDir, projectRoot);
    return {
        name: manifest.name,
        version: manifest.version,
        path: targetDir,
        source: "local",
        collisions,
    };
}
async function installFromGitHub(repo, version, pluginsDirectory, projectRoot, postInstall) {
    // Resolve latest version if not specified
    const tag = version ?? (await fetchLatestTag(repo));
    const archiveUrl = `https://github.com/${repo}/releases/download/${tag}/${repo.split("/")[1]}-${tag}.tar.gz`;
    console.log(`Downloading ${repo}@${tag}...`);
    const response = await fetch(archiveUrl);
    if (!response.ok) {
        throw new Error(`Failed to download ${archiveUrl}: ${response.status} ${response.statusText}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    // Extract to temp, then move to plugins/
    const tmpDir = path.join(pluginsDirectory, `.tmp-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    try {
        await extractTarGz(buffer, tmpDir);
        // Find the manifest in extracted contents
        const entries = fs.readdirSync(tmpDir);
        const extractedDir = entries.length === 1
            ? path.join(tmpDir, entries[0])
            : tmpDir;
        const manifest = readManifest(extractedDir);
        const errors = validateManifest(manifest);
        if (errors.length > 0) {
            throw new Error(`Invalid plugin manifest:\n  ${errors.join("\n  ")}`);
        }
        const pluginDir = path.join(pluginsDirectory, manifest.name.replace(/^@[^/]+\//, ""));
        if (fs.existsSync(pluginDir)) {
            fs.rmSync(pluginDir, { recursive: true });
        }
        fs.renameSync(extractedDir, pluginDir);
        // Update lockfile
        const lockfile = readLockfile(projectRoot);
        lockfile.plugins = lockfile.plugins.filter((p) => p.name !== manifest.name);
        lockfile.plugins.push({
            name: manifest.name,
            version: manifest.version,
            repo,
            sha256,
            installedAt: new Date().toISOString(),
        });
        writeLockfile(projectRoot, lockfile);
        const collisions = detectCollisions(manifest, projectRoot);
        postInstall?.(pluginDir, projectRoot);
        console.log(`Installed ${manifest.name}@${manifest.version}`);
        return {
            name: manifest.name,
            version: manifest.version,
            path: pluginDir,
            source: "github",
            collisions,
        };
    }
    finally {
        if (fs.existsSync(tmpDir)) {
            fs.rmSync(tmpDir, { recursive: true });
        }
    }
}
async function fetchLatestTag(repo) {
    const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers: { Accept: "application/vnd.github.v3+json" } });
    if (!response.ok) {
        throw new Error(`Failed to fetch latest release for ${repo}: ${response.status}`);
    }
    const data = (await response.json());
    return data.tag_name;
}
async function extractTarGz(buffer, targetDir) {
    // Use tar CLI for extraction (available on all platforms)
    const { execSync } = await import("node:child_process");
    const tmpArchive = path.join(targetDir, "archive.tar.gz");
    fs.writeFileSync(tmpArchive, buffer);
    execSync(`tar -xzf "${tmpArchive}" -C "${targetDir}"`);
    fs.unlinkSync(tmpArchive);
}
/**
 * Uninstall a plugin by name.
 */
export function uninstallPlugin(name, projectRoot) {
    const root = projectRoot ?? process.cwd();
    const dir = pluginsDir(root);
    const shortName = name.replace(/^@[^/]+\//, "");
    const pluginDir = path.join(dir, shortName);
    if (!fs.existsSync(pluginDir)) {
        throw new Error(`Plugin not found: ${name} (expected at ${pluginDir})`);
    }
    fs.rmSync(pluginDir, { recursive: true });
    // Update lockfile
    const lockfile = readLockfile(root);
    lockfile.plugins = lockfile.plugins.filter((p) => p.name !== name);
    writeLockfile(root, lockfile);
    console.log(`Uninstalled ${name}`);
}
/**
 * List all installed plugins by scanning the plugins/ directory.
 */
export function listInstalledPlugins(projectRoot) {
    const root = projectRoot ?? process.cwd();
    const dir = pluginsDir(root);
    if (!fs.existsSync(dir))
        return [];
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name.startsWith("."))
            continue;
        const pluginPath = path.join(dir, entry.name);
        const manifestPath = path.join(pluginPath, "orqa-plugin.json");
        if (!fs.existsSync(manifestPath))
            continue;
        try {
            const manifest = readManifest(pluginPath);
            const lockfile = readLockfile(root);
            const locked = lockfile.plugins.find((p) => p.name === manifest.name);
            results.push({
                name: manifest.name,
                version: manifest.version,
                path: pluginPath,
                source: locked ? "github" : "local",
                collisions: [],
            });
        }
        catch {
            // Skip invalid plugins
        }
    }
    return results;
}
//# sourceMappingURL=installer.js.map