/**
 * Auto-fixer for objectively fixable integrity findings.
 *
 * Currently supports:
 * - MissingInverse: adds the bidirectional inverse relationship on the target artifact
 *
 * Uses the `yaml` library for all frontmatter manipulation — never regex.
 * Each fix reads the file, parses YAML, modifies the relationships array,
 * and writes back with proper formatting.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
/**
 * Parse frontmatter from a markdown file.
 * Returns [parsedYaml, bodyContent] or null if parsing fails.
 */
function parseFrontmatter(content) {
    if (!content.startsWith("---\n"))
        return null;
    const fmEnd = content.indexOf("\n---", 4);
    if (fmEnd === -1)
        return null;
    const fmText = content.substring(4, fmEnd);
    const body = content.substring(fmEnd + 4);
    try {
        const fm = parseYaml(fmText);
        if (!fm || typeof fm !== "object")
            return null;
        return [fm, body];
    }
    catch {
        return null;
    }
}
/**
 * Write frontmatter back to a markdown file.
 * Uses yaml.stringify for proper formatting.
 */
function writeFrontmatter(filePath, fm, body) {
    const yamlText = stringifyYaml(fm, { lineWidth: 0 }).trimEnd();
    writeFileSync(filePath, `---\n${yamlText}\n---${body}`);
}
/**
 * Apply all auto-fixable findings to disk.
 *
 * Currently handles:
 * - MissingInverse: parses the finding message to extract target ID and
 *   expected inverse type, then adds the relationship to the target file.
 *
 * Batches fixes per file to minimise disk I/O — multiple fixes to the
 * same target file are applied in a single read-modify-write cycle.
 */
export function applyFixes(findings, graph, ctx, projectRoot) {
    const fixable = findings.filter((f) => f.autoFixable);
    if (fixable.length === 0) {
        return { attempted: 0, applied: 0, failed: 0, results: [] };
    }
    // Group fixes by target file to batch writes
    const fixesByFile = new Map();
    for (const finding of fixable) {
        if (finding.category !== "MissingInverse")
            continue;
        // Parse the finding to extract source, target, and inverse type
        const parsed = parseMissingInverseFinding(finding, ctx);
        if (!parsed)
            continue;
        const targetNode = graph.nodes.get(parsed.targetId);
        if (!targetNode)
            continue;
        const targetFile = resolve(projectRoot, targetNode.path);
        const list = fixesByFile.get(targetFile) ?? [];
        list.push({ ...parsed, finding });
        fixesByFile.set(targetFile, list);
    }
    // Apply fixes per file
    const results = [];
    for (const [targetFile, fixes] of fixesByFile) {
        try {
            const content = readFileSync(targetFile, "utf-8");
            const parsed = parseFrontmatter(content);
            if (!parsed) {
                for (const fix of fixes) {
                    results.push({
                        finding: fix.finding,
                        applied: false,
                        targetFile,
                        error: "Failed to parse frontmatter",
                    });
                }
                continue;
            }
            const [fm, body] = parsed;
            if (!Array.isArray(fm.relationships)) {
                fm.relationships = [];
            }
            const rels = fm.relationships;
            let modified = false;
            for (const fix of fixes) {
                // Check if the inverse already exists (idempotent)
                const exists = rels.some((r) => r.target === fix.sourceId && r.type === fix.inverseType);
                if (!exists) {
                    rels.push({ target: fix.sourceId, type: fix.inverseType });
                    modified = true;
                    results.push({ finding: fix.finding, applied: true, targetFile });
                }
                else {
                    results.push({ finding: fix.finding, applied: false, targetFile, error: "Already exists" });
                }
            }
            if (modified) {
                writeFrontmatter(targetFile, fm, body);
            }
        }
        catch (e) {
            const errMsg = e instanceof Error ? e.message : String(e);
            for (const fix of fixes) {
                results.push({ finding: fix.finding, applied: false, targetFile, error: errMsg });
            }
        }
    }
    const applied = results.filter((r) => r.applied).length;
    return {
        attempted: results.length,
        applied,
        failed: results.length - applied,
        results,
    };
}
/**
 * Parse a MissingInverse finding to extract the fix parameters.
 *
 * Finding message format:
 *   "SOURCE_ID --rel-type--> TARGET_ID but TARGET_ID has no INVERSE_TYPE edge back to SOURCE_ID"
 */
function parseMissingInverseFinding(finding, ctx) {
    const match = finding.message.match(/^(\S+) --(\S+)--> (\S+) but \S+ has no (\S+) edge back/);
    if (!match)
        return null;
    const [, sourceId, _relType, targetId, inverseType] = match;
    // Validate the inverse type is known
    if (!ctx.inverseMap.has(inverseType))
        return null;
    return { sourceId, targetId, inverseType };
}
//# sourceMappingURL=fixer.js.map