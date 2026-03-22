/**
 * Build an artifact graph from .orqa/ directory structure.
 *
 * Type inference is driven by project.json artifacts config —
 * no hardcoded artifact type strings.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, basename, extname } from "node:path";
import { parse as parseYaml } from "yaml";
import { PLATFORM_CONFIG } from "./types.js";
/**
 * Build a type registry from project.json's artifacts config.
 *
 * Each entry maps a path (e.g. ".orqa/delivery/epics") to its type key
 * (e.g. "epic"). This replaces the hardcoded inferType() function.
 */
function buildTypeRegistry(projectRoot) {
    const registry = [];
    try {
        const projectJsonPath = join(projectRoot, ".orqa", "project.json");
        const raw = readFileSync(projectJsonPath, "utf-8");
        const projectJson = JSON.parse(raw);
        const artifacts = projectJson["artifacts"];
        if (!Array.isArray(artifacts))
            return registry;
        for (const entry of artifacts) {
            const e = entry;
            if (Array.isArray(e["children"])) {
                // Group entry
                for (const child of e["children"]) {
                    if (typeof child["key"] === "string" && typeof child["path"] === "string") {
                        registry.push({
                            path: child["path"].replace(/\\/g, "/"),
                            key: child["key"],
                        });
                    }
                }
            }
            else if (typeof e["key"] === "string" && typeof e["path"] === "string") {
                // Direct type entry
                registry.push({
                    path: e["path"].replace(/\\/g, "/"),
                    key: e["key"],
                });
            }
        }
    }
    catch {
        // No project.json — fall back to empty registry
    }
    return registry;
}
/**
 * Infer artifact type from its relative path using the type registry.
 *
 * Matches the longest path prefix from the registry. Returns "unknown"
 * if no match is found.
 */
function inferType(relPath, registry) {
    const normalised = relPath.replace(/\\/g, "/");
    // Find the longest matching path prefix
    let bestMatch = null;
    for (const entry of registry) {
        if (normalised.startsWith(entry.path) || normalised.includes(`/${entry.path}`)) {
            if (!bestMatch || entry.path.length > bestMatch.path.length) {
                bestMatch = entry;
            }
        }
    }
    if (bestMatch)
        return bestMatch.key;
    // Fallback: infer type from the artifact ID prefix using core.json's
    // artifactTypes. This handles artifacts in app/.orqa/ and plugins/ where
    // the path-based registry (from project.json) has no mapping.
    return "unknown"; // Will be resolved per-node after ID is parsed
}
/**
 * Build an ID prefix → type key map from plugin manifests.
 * Scans plugins/ and connectors/ for orqa-plugin.json schemas.
 */
function buildPrefixMap(projectRoot) {
    const map = new Map();
    // First: anything from PLATFORM_CONFIG (may be empty now)
    const platformAny = PLATFORM_CONFIG;
    const platformTypes = platformAny["artifactTypes"];
    if (platformTypes) {
        for (const t of platformTypes) {
            if (t.idPrefix)
                map.set(t.idPrefix, t.key);
        }
    }
    // Then: merge from plugin manifests (plugins take precedence)
    for (const container of ["plugins", "connectors"]) {
        const containerDir = join(projectRoot, container);
        let entries;
        try {
            entries = readdirSync(containerDir, { withFileTypes: true });
        }
        catch {
            continue;
        }
        for (const entry of entries) {
            if (!entry.isDirectory() || entry.name.startsWith(".") || entry.name === "node_modules")
                continue;
            try {
                const raw = readFileSync(join(containerDir, entry.name, "orqa-plugin.json"), "utf-8");
                const manifest = JSON.parse(raw);
                const provides = manifest["provides"];
                if (!provides)
                    continue;
                const schemas = provides["schemas"];
                if (!Array.isArray(schemas))
                    continue;
                for (const s of schemas) {
                    const schema = s;
                    const key = schema["key"];
                    const prefix = schema["idPrefix"];
                    if (key && prefix)
                        map.set(prefix, key);
                }
            }
            catch {
                continue;
            }
        }
    }
    return map;
}
/** Cached prefix map per project root. */
let _prefixMapCache = null;
/**
 * Infer artifact type from an artifact ID prefix using plugin manifests.
 * E.g. "DOC-036" → "doc", "KNOW-011" → "knowledge", "EPIC-001" → "epic".
 * Falls back to "unknown" if no match.
 */
function inferTypeFromId(id, projectRoot) {
    if (!_prefixMapCache || _prefixMapCache.root !== projectRoot) {
        _prefixMapCache = { root: projectRoot, map: buildPrefixMap(projectRoot) };
    }
    const prefix = id.match(/^([A-Z]+)-/)?.[1];
    if (!prefix)
        return "unknown";
    return _prefixMapCache.map.get(prefix) ?? "unknown";
}
/** Extract YAML frontmatter from markdown content. Returns [frontmatter, body]. */
function extractFrontmatterAndBody(content) {
    const lines = content.split("\n");
    if (lines[0]?.trim() !== "---")
        return [null, content];
    let end = -1;
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === "---") {
            end = i;
            break;
        }
    }
    if (end === -1)
        return [null, content];
    const yamlText = lines.slice(1, end).join("\n");
    const body = lines.slice(end + 1).join("\n");
    try {
        const parsed = parseYaml(yamlText);
        return [parsed ?? null, body];
    }
    catch {
        return [null, body];
    }
}
/** Load body templates from schema.json files in the .orqa/ tree. */
function loadBodyTemplates(orqaDir, registry) {
    const templates = new Map();
    const schemaFiles = walkSchemas(orqaDir);
    for (const schemaPath of schemaFiles) {
        try {
            const raw = readFileSync(schemaPath, "utf-8");
            const schema = JSON.parse(raw);
            const bt = schema["bodyTemplate"];
            if (!bt || typeof bt !== "object" || bt === null)
                continue;
            const btObj = bt;
            if (!Array.isArray(btObj["sections"]))
                continue;
            // Derive artifact type from the directory containing schema.json
            const relDir = relative(orqaDir, schemaPath).replace(/\\/g, "/");
            const dirType = inferType(".orqa/" + relDir, registry);
            if (dirType === "unknown")
                continue;
            const sections = btObj["sections"]
                .filter((s) => typeof s["heading"] === "string")
                .map((s) => ({
                heading: s["heading"],
                required: s["required"] === true,
            }));
            if (sections.length > 0) {
                templates.set(dirType, { sections });
            }
        }
        catch {
            // Skip unreadable or invalid schema files
        }
    }
    return templates;
}
/** Recursively find all schema.json files. */
function walkSchemas(dir) {
    const results = [];
    let entries;
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    }
    catch {
        return results;
    }
    for (const entry of entries) {
        if (entry.name.startsWith(".") || entry.name.startsWith("_"))
            continue;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...walkSchemas(full));
        }
        else if (entry.name === "schema.json") {
            results.push(full);
        }
    }
    return results;
}
/**
 * Collect forward references from the `relationships` frontmatter array.
 *
 * Graph-first model: all artifact references use the `relationships` array.
 * Standalone reference fields (milestone, epic, depends-on, etc.) are no longer used.
 */
function collectRefs(fm, sourceId) {
    const refs = [];
    const relationships = fm["relationships"];
    if (Array.isArray(relationships)) {
        for (const rel of relationships) {
            if (typeof rel === "object" && rel !== null) {
                const r = rel;
                const target = typeof r["target"] === "string" ? r["target"].trim() : "";
                const relType = typeof r["type"] === "string" ? r["type"].trim() : undefined;
                if (target) {
                    refs.push({
                        sourceId,
                        targetId: target,
                        field: "relationships",
                        relationshipType: relType,
                    });
                }
            }
        }
    }
    return refs;
}
/** Recursively find all .md files (excluding README.md and hidden entries). */
function walkDir(dir) {
    const results = [];
    let entries;
    try {
        entries = readdirSync(dir, { withFileTypes: true });
    }
    catch {
        return results;
    }
    for (const entry of entries) {
        if (entry.name.startsWith(".") || entry.name.startsWith("_"))
            continue;
        if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "target")
            continue;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...walkDir(full));
        }
        else if (entry.name.endsWith(".md") &&
            entry.name !== "README.md") {
            results.push(full);
        }
    }
    return results;
}
/**
 * Discover additional scan directories beyond .orqa/:
 * app/.orqa/ (core artifacts), plugins/*, connectors/*.
 */
function discoverScanDirs(projectRoot) {
    const dirs = [];
    // Core artifacts (shipped with the app)
    const appOrqa = join(projectRoot, "app", ".orqa");
    try {
        readdirSync(appOrqa);
        dirs.push(appOrqa);
    }
    catch { /* not present */ }
    // Plugin and connector artifacts
    for (const container of ["plugins", "connectors"]) {
        const containerDir = join(projectRoot, container);
        let entries;
        try {
            entries = readdirSync(containerDir, { withFileTypes: true });
        }
        catch {
            continue;
        }
        for (const entry of entries) {
            if (!entry.isDirectory() || entry.name.startsWith(".") || entry.name === "node_modules")
                continue;
            dirs.push(join(containerDir, entry.name));
        }
    }
    return dirs;
}
/** Build the artifact graph from disk. */
export function buildGraph(config) {
    const orqaDir = join(config.projectRoot, ".orqa");
    const nodes = new Map();
    // Build type registry from project.json artifacts config
    const typeRegistry = buildTypeRegistry(config.projectRoot);
    // Load body templates from schema.json files
    const bodyTemplates = loadBodyTemplates(orqaDir, typeRegistry);
    // Scan project .orqa/ + core app/.orqa/ + plugins/ + connectors/
    const additionalDirs = discoverScanDirs(config.projectRoot);
    const files = [
        ...walkDir(orqaDir),
        ...additionalDirs.flatMap((dir) => walkDir(dir)),
    ];
    // Pass 1: collect all nodes
    for (const file of files) {
        let content;
        try {
            content = readFileSync(file, "utf-8").replace(/\r\n/g, "\n");
        }
        catch {
            continue;
        }
        const [fm, body] = extractFrontmatterAndBody(content);
        if (!fm)
            continue;
        const id = typeof fm["id"] === "string" ? fm["id"].trim() : "";
        if (!id)
            continue;
        const relPath = relative(config.projectRoot, file).replace(/\\/g, "/");
        const title = typeof fm["title"] === "string" ? fm["title"] : basename(file, extname(file));
        const status = typeof fm["status"] === "string" ? fm["status"] : undefined;
        const referencesOut = collectRefs(fm, id);
        // Path-based inference first, fall back to ID prefix for artifacts
        // outside the project.json path registry (app/.orqa/, plugins/)
        let artifactType = inferType(relPath, typeRegistry);
        if (artifactType === "unknown") {
            artifactType = inferTypeFromId(id, config.projectRoot);
        }
        nodes.set(id, {
            id,
            path: relPath,
            artifactType,
            title,
            status,
            frontmatter: fm,
            body,
            referencesOut,
            referencesIn: [],
        });
    }
    // Pass 2: build reverse references
    for (const node of nodes.values()) {
        for (const ref of node.referencesOut) {
            const target = nodes.get(ref.targetId);
            if (target) {
                target.referencesIn.push({
                    sourceId: node.id,
                    targetId: ref.targetId,
                    field: ref.field,
                    relationshipType: ref.relationshipType,
                });
            }
        }
    }
    return { nodes, bodyTemplates };
}
//# sourceMappingURL=graph.js.map