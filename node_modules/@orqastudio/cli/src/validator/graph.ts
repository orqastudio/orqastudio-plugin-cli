/**
 * Build an artifact graph from .orqa/ directory structure.
 *
 * Type inference is driven by project.json artifacts config —
 * no hardcoded artifact type strings.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, basename, extname } from "node:path";
import { parse as parseYaml } from "yaml";
import type { ArtifactGraph, ArtifactNode, ArtifactRef, BodyTemplate, IntegrityConfig } from "./types.js";
import { PLATFORM_CONFIG } from "./types.js";

/** A type registry entry: path prefix → artifact type key. */
interface TypeRegistryEntry {
  path: string;
  key: string;
}

/**
 * Build a type registry from project.json's artifacts config.
 *
 * Each entry maps a path (e.g. ".orqa/delivery/epics") to its type key
 * (e.g. "epic"). This replaces the hardcoded inferType() function.
 */
function buildTypeRegistry(projectRoot: string): TypeRegistryEntry[] {
  const registry: TypeRegistryEntry[] = [];

  try {
    const projectJsonPath = join(projectRoot, ".orqa", "project.json");
    const raw = readFileSync(projectJsonPath, "utf-8");
    const projectJson = JSON.parse(raw) as Record<string, unknown>;

    const artifacts = projectJson["artifacts"];
    if (!Array.isArray(artifacts)) return registry;

    for (const entry of artifacts) {
      const e = entry as Record<string, unknown>;
      if (Array.isArray(e["children"])) {
        // Group entry
        for (const child of e["children"] as Array<Record<string, unknown>>) {
          if (typeof child["key"] === "string" && typeof child["path"] === "string") {
            registry.push({
              path: (child["path"] as string).replace(/\\/g, "/"),
              key: child["key"] as string,
            });
          }
        }
      } else if (typeof e["key"] === "string" && typeof e["path"] === "string") {
        // Direct type entry
        registry.push({
          path: (e["path"] as string).replace(/\\/g, "/"),
          key: e["key"] as string,
        });
      }
    }
  } catch {
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
function inferType(relPath: string, registry: TypeRegistryEntry[]): string {
  const normalised = relPath.replace(/\\/g, "/");

  // Find the longest matching path prefix
  let bestMatch: TypeRegistryEntry | null = null;
  for (const entry of registry) {
    if (normalised.startsWith(entry.path) || normalised.includes(`/${entry.path}`)) {
      if (!bestMatch || entry.path.length > bestMatch.path.length) {
        bestMatch = entry;
      }
    }
  }

  if (bestMatch) return bestMatch.key;

  // Fallback: infer type from the artifact ID prefix using core.json's
  // artifactTypes. This handles artifacts in app/.orqa/ and plugins/ where
  // the path-based registry (from project.json) has no mapping.
  return "unknown"; // Will be resolved per-node after ID is parsed
}

/**
 * Infer artifact type from an artifact ID prefix using core.json.
 * E.g. "DOC-036" → "doc", "SKILL-011" → "skill", "EPIC-001" → "epic".
 * Falls back to "unknown" if no match.
 */
function inferTypeFromId(id: string): string {
  const platformAny = PLATFORM_CONFIG as unknown as Record<string, unknown>;
  const types = platformAny["artifactTypes"] as Array<{ key: string; idPrefix: string }> | undefined;
  if (!types) return "unknown";

  const prefix = id.match(/^([A-Z]+)-/)?.[1];
  if (!prefix) return "unknown";

  const match = types.find((t) => t.idPrefix === prefix);
  return match?.key ?? "unknown";
}

/** Extract YAML frontmatter from markdown content. Returns [frontmatter, body]. */
function extractFrontmatterAndBody(content: string): [Record<string, unknown> | null, string] {
  const lines = content.split("\n");
  if (lines[0]?.trim() !== "---") return [null, content];

  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      end = i;
      break;
    }
  }
  if (end === -1) return [null, content];

  const yamlText = lines.slice(1, end).join("\n");
  const body = lines.slice(end + 1).join("\n");
  try {
    const parsed = parseYaml(yamlText) as Record<string, unknown> | null;
    return [parsed ?? null, body];
  } catch {
    return [null, body];
  }
}

/** Load body templates from schema.json files in the .orqa/ tree. */
function loadBodyTemplates(orqaDir: string, registry: TypeRegistryEntry[]): Map<string, BodyTemplate> {
  const templates = new Map<string, BodyTemplate>();
  const schemaFiles = walkSchemas(orqaDir);

  for (const schemaPath of schemaFiles) {
    try {
      const raw = readFileSync(schemaPath, "utf-8");
      const schema = JSON.parse(raw) as Record<string, unknown>;
      const bt = schema["bodyTemplate"];
      if (!bt || typeof bt !== "object" || bt === null) continue;
      const btObj = bt as Record<string, unknown>;
      if (!Array.isArray(btObj["sections"])) continue;

      // Derive artifact type from the directory containing schema.json
      const relDir = relative(orqaDir, schemaPath).replace(/\\/g, "/");
      const dirType = inferType(".orqa/" + relDir, registry);
      if (dirType === "unknown") continue;

      const sections = (btObj["sections"] as Array<Record<string, unknown>>)
        .filter((s) => typeof s["heading"] === "string")
        .map((s) => ({
          heading: s["heading"] as string,
          required: s["required"] === true,
        }));

      if (sections.length > 0) {
        templates.set(dirType, { sections });
      }
    } catch {
      // Skip unreadable or invalid schema files
    }
  }

  return templates;
}

/** Recursively find all schema.json files. */
function walkSchemas(dir: string): string[] {
  const results: string[] = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkSchemas(full));
    } else if (entry.name === "schema.json") {
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
function collectRefs(fm: Record<string, unknown>, sourceId: string): ArtifactRef[] {
  const refs: ArtifactRef[] = [];

  const relationships = fm["relationships"];
  if (Array.isArray(relationships)) {
    for (const rel of relationships) {
      if (typeof rel === "object" && rel !== null) {
        const r = rel as Record<string, unknown>;
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
function walkDir(dir: string): string[] {
  const results: string[] = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full));
    } else if (
      entry.name.endsWith(".md") &&
      entry.name !== "README.md"
    ) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Discover additional scan directories beyond .orqa/:
 * app/.orqa/ (core artifacts), plugins/*, connectors/*.
 */
function discoverScanDirs(projectRoot: string): string[] {
  const dirs: string[] = [];

  // Core artifacts (shipped with the app)
  const appOrqa = join(projectRoot, "app", ".orqa");
  try { readdirSync(appOrqa); dirs.push(appOrqa); } catch { /* not present */ }

  // Plugin and connector artifacts
  for (const container of ["plugins", "connectors"]) {
    const containerDir = join(projectRoot, container);
    let entries;
    try { entries = readdirSync(containerDir, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".") || entry.name === "node_modules") continue;
      dirs.push(join(containerDir, entry.name));
    }
  }

  return dirs;
}

/** Build the artifact graph from disk. */
export function buildGraph(config: IntegrityConfig): ArtifactGraph {
  const orqaDir = join(config.projectRoot, ".orqa");
  const nodes = new Map<string, ArtifactNode>();

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
    } catch {
      continue;
    }

    const [fm, body] = extractFrontmatterAndBody(content);
    if (!fm) continue;

    const id = typeof fm["id"] === "string" ? fm["id"].trim() : "";
    if (!id) continue;

    const relPath = relative(config.projectRoot, file).replace(/\\/g, "/");
    const title = typeof fm["title"] === "string" ? fm["title"] : basename(file, extname(file));
    const status = typeof fm["status"] === "string" ? fm["status"] : undefined;

    const referencesOut = collectRefs(fm, id);

    // Path-based inference first, fall back to ID prefix for artifacts
    // outside the project.json path registry (app/.orqa/, plugins/)
    let artifactType = inferType(relPath, typeRegistry);
    if (artifactType === "unknown") {
      artifactType = inferTypeFromId(id);
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
