/**
 * Run all integrity checks against an artifact graph.
 *
 * Every check is schema-driven — checks read constraints from the merged
 * config (core.json + project.json + plugin manifests) and enforce them
 * generically. No check contains artifact-type or relationship-key strings.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PLATFORM_CONFIG, buildInverseMap } from "./types.js";
import { checkBrokenLinks } from "./checks/broken-links.js";
import { checkMissingInverses } from "./checks/missing-inverses.js";
import { checkRelationshipConstraints } from "./checks/relationship-constraints.js";
import { checkVocabularyCompliance } from "./checks/vocabulary-compliance.js";
import { checkRequiredRelationships } from "./checks/required-relationships.js";
import { checkCircularDependencies } from "./checks/circular-dependencies.js";
import { checkBodyTemplates } from "./checks/body-templates.js";
import { checkFrontmatterRequired } from "./checks/frontmatter-required.js";
/**
 * All check functions — purely schema-driven.
 *
 * 1. BrokenLink — every relationship target resolves to a node
 * 2. MissingInverse — bidirectional inverse exists for every edge
 * 3. RelationshipConstraint — from/to type constraints from schema
 * 4. VocabularyCompliance — relationship type is a known schema key
 * 5. RequiredRelationship — constraints.required + minCount from schema
 * 6. CircularDependency — cycles in dependency-semantic edges
 * 7. BodyTemplate — required body sections from schema.json files
 * 8. FrontmatterRequired — required frontmatter fields from plugin schemas
 */
export const ALL_CHECKS = [
    checkBrokenLinks,
    checkMissingInverses,
    checkRelationshipConstraints,
    checkVocabularyCompliance,
    checkRequiredRelationships,
    checkCircularDependencies,
    checkBodyTemplates,
    checkFrontmatterRequired,
];
/**
 * Load artifact schema definitions from plugin orqa-plugin.json files.
 * Returns a map from artifact type key → required frontmatter field names.
 * Scans plugins/ and connectors/ directories.
 */
function loadPluginFrontmatterRequirements(projectRoot) {
    const requirements = new Map();
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
                const manifestPath = join(containerDir, entry.name, "orqa-plugin.json");
                const raw = readFileSync(manifestPath, "utf-8");
                const manifest = JSON.parse(raw);
                const provides = manifest["provides"];
                if (!provides)
                    continue;
                const schemas = provides["schemas"];
                if (!Array.isArray(schemas))
                    continue;
                for (const schema of schemas) {
                    const s = schema;
                    const key = typeof s["key"] === "string" ? s["key"] : null;
                    if (!key)
                        continue;
                    const fm = s["frontmatter"];
                    if (!fm)
                        continue;
                    const required = fm["required"];
                    if (!Array.isArray(required))
                        continue;
                    const fields = required.filter((f) => typeof f === "string");
                    if (fields.length === 0)
                        continue;
                    // Union if multiple plugins define schemas for the same type
                    const existing = requirements.get(key);
                    if (existing) {
                        for (const f of fields) {
                            if (!existing.includes(f))
                                existing.push(f);
                        }
                    }
                    else {
                        requirements.set(key, [...fields]);
                    }
                }
            }
            catch {
                continue;
            }
        }
    }
    return requirements;
}
/**
 * Load relationship definitions from plugin orqa-plugin.json files.
 * Scans plugins/ and connectors/ directories.
 */
function loadPluginRelationships(projectRoot) {
    const rels = [];
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
                const manifestPath = join(containerDir, entry.name, "orqa-plugin.json");
                const raw = readFileSync(manifestPath, "utf-8");
                const manifest = JSON.parse(raw);
                const provides = manifest["provides"];
                if (!provides)
                    continue;
                const pluginRels = provides["relationships"];
                if (!Array.isArray(pluginRels))
                    continue;
                for (const r of pluginRels) {
                    const pr = r;
                    if (typeof pr["key"] === "string" && typeof pr["inverse"] === "string") {
                        rels.push({
                            key: pr["key"],
                            inverse: pr["inverse"],
                            label: pr["label"] ?? pr["key"],
                            inverseLabel: pr["inverseLabel"] ?? pr["inverse"],
                            from: Array.isArray(pr["from"]) ? pr["from"] : [],
                            to: Array.isArray(pr["to"]) ? pr["to"] : [],
                            description: pr["description"] ?? "",
                            semantic: typeof pr["semantic"] === "string" ? pr["semantic"] : undefined,
                            constraints: typeof pr["constraints"] === "object" && pr["constraints"] !== null
                                ? pr["constraints"]
                                : undefined,
                        });
                    }
                }
            }
            catch {
                continue;
            }
        }
    }
    return rels;
}
/**
 * Build a CheckContext by merging platform config + project.json + plugin manifests.
 *
 * The merged context is the single source of truth for all checks.
 */
export function buildCheckContext(projectRoot) {
    // Start with platform relationships
    const allRelationships = [...PLATFORM_CONFIG.relationships];
    // Mutable semantics copy so plugins can extend
    const allSemantics = {};
    for (const [k, v] of Object.entries(PLATFORM_CONFIG.semantics)) {
        allSemantics[k] = { description: v.description, keys: [...v.keys] };
    }
    // Load plugin frontmatter requirements
    const frontmatterRequirements = loadPluginFrontmatterRequirements(projectRoot);
    // Load plugin relationships — extend existing definitions or add new ones.
    // When a plugin declares a relationship key that already exists (e.g. extending
    // core's `merged-into` to also allow research→research), the from/to arrays
    // are unioned rather than creating a duplicate entry.
    const pluginRels = loadPluginRelationships(projectRoot);
    for (const pr of pluginRels) {
        const existing = allRelationships.find((r) => r.key === pr.key);
        if (existing) {
            // Extend from/to constraints (union)
            const ex = existing;
            for (const t of pr.from) {
                if (!ex.from.includes(t))
                    ex.from.push(t);
            }
            for (const t of pr.to) {
                if (!ex.to.includes(t))
                    ex.to.push(t);
            }
            // Merge constraints if plugin provides them and existing doesn't
            if (pr.constraints && !ex.constraints) {
                ex.constraints = pr.constraints;
            }
        }
        else {
            allRelationships.push(pr);
        }
        if (pr.semantic) {
            if (!allSemantics[pr.semantic]) {
                allSemantics[pr.semantic] = { description: pr.semantic, keys: [] };
            }
            const sem = allSemantics[pr.semantic];
            if (!sem.keys.includes(pr.key))
                sem.keys.push(pr.key);
            if (!sem.keys.includes(pr.inverse))
                sem.keys.push(pr.inverse);
        }
    }
    // Load project.json for project-level extensions
    let deliveryTypes = [];
    try {
        const projectJsonPath = join(projectRoot, ".orqa", "project.json");
        const raw = readFileSync(projectJsonPath, "utf-8");
        const projectJson = JSON.parse(raw);
        // Merge project relationships
        const projRels = projectJson["relationships"];
        if (Array.isArray(projRels)) {
            for (const rel of projRels) {
                const r = rel;
                if (typeof r["key"] === "string" && typeof r["inverse"] === "string") {
                    allRelationships.push({
                        key: r["key"],
                        inverse: r["inverse"],
                        label: r["label"] ?? r["key"],
                        inverseLabel: r["inverse_label"] ?? r["inverse"],
                        from: [],
                        to: [],
                        description: "",
                    });
                }
            }
        }
        // Load delivery types
        const delivery = projectJson["delivery"];
        if (delivery && Array.isArray(delivery["types"])) {
            deliveryTypes = delivery["types"].map((dt) => ({
                key: dt["key"],
                parent: dt["parent"]
                    ? {
                        type: dt["parent"]["type"],
                        relationship: dt["parent"]["relationship"],
                    }
                    : undefined,
            }));
        }
    }
    catch {
        // No project.json — use platform defaults only
    }
    // If no delivery types from project.json, try loading from plugin manifests
    if (deliveryTypes.length === 0) {
        for (const container of ["plugins"]) {
            const containerDir = join(projectRoot, container);
            let entries;
            try {
                entries = readdirSync(containerDir, { withFileTypes: true });
            }
            catch {
                continue;
            }
            for (const entry of entries) {
                if (!entry.isDirectory())
                    continue;
                try {
                    const raw = readFileSync(join(containerDir, entry.name, "orqa-plugin.json"), "utf-8");
                    const manifest = JSON.parse(raw);
                    const delivery = manifest["delivery"];
                    if (delivery && Array.isArray(delivery["types"])) {
                        deliveryTypes = delivery["types"].map((dt) => ({
                            key: dt["key"],
                            parent: dt["parent"]
                                ? {
                                    type: dt["parent"]["type"],
                                    relationship: dt["parent"]["relationship"],
                                }
                                : undefined,
                        }));
                    }
                }
                catch {
                    continue;
                }
            }
        }
    }
    return {
        inverseMap: buildInverseMap(allRelationships),
        semantics: allSemantics,
        deliveryTypes,
        relationships: allRelationships,
        frontmatterRequirements,
    };
}
/** Run all integrity checks and return findings. */
export function runChecks(graph, ctx) {
    const findings = [];
    for (const check of ALL_CHECKS) {
        findings.push(...check(graph, ctx));
    }
    return findings;
}
/** Run all checks and return a summary. */
export function runChecksWithSummary(graph, ctx) {
    const findings = runChecks(graph, ctx);
    const byCategory = new Map();
    let errors = 0;
    let warnings = 0;
    for (const f of findings) {
        if (f.severity === "error")
            errors++;
        else
            warnings++;
        byCategory.set(f.category, (byCategory.get(f.category) ?? 0) + 1);
    }
    return {
        totalFindings: findings.length,
        errors,
        warnings,
        byCategory,
        findings,
    };
}
//# sourceMappingURL=checker.js.map