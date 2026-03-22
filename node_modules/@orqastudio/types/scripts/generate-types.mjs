/**
 * Schema-driven TypeScript generation.
 *
 * Reads all *.schema.json files from src/platform/ and generates TypeScript
 * interfaces into src/generated/. One output file per schema. Creates an
 * index.ts that re-exports everything.
 *
 * Usage:
 *   node scripts/generate-types.mjs
 */

import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "json-schema-to-typescript";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const SCHEMA_DIR = join(__dirname, "../src/platform");
const OUTPUT_DIR = join(__dirname, "../src/generated");

const COMPILE_OPTIONS = {
  bannerComment:
    "/* eslint-disable */\n// THIS FILE IS AUTO-GENERATED — DO NOT EDIT BY HAND.\n// Source: libs/types/src/platform/*.schema.json\n// Regenerate: node scripts/generate-types.mjs",
  style: {
    bracketSpacing: true,
    printWidth: 100,
    semi: true,
    singleQuote: false,
    tabWidth: 2,
    trailingComma: "es5",
    useTabs: false,
  },
  // Generate interfaces, not classes.
  declareExternallyReferenced: true,
  // Ensure strict optional properties.
  strictIndexSignatures: true,
  // Treat additionalProperties: true as Record<string, unknown>.
  unknownAny: true,
  // Do not collapse oneOf to a union when the schema has $defs.
  enableConstEnums: false,
};

async function ensureOutputDir() {
  await mkdir(OUTPUT_DIR, { recursive: true });
}

async function findSchemaFiles() {
  const entries = await readdir(SCHEMA_DIR);
  return entries
    .filter((f) => f.endsWith(".schema.json"))
    .map((f) => join(SCHEMA_DIR, f));
}

function schemaNameToOutputName(schemaPath) {
  const base = basename(schemaPath, ".schema.json");
  return `${base}.generated.ts`;
}

async function generateOne(schemaPath) {
  const content = await readFile(schemaPath, "utf-8");
  const schema = JSON.parse(content);

  // Compile all $defs to TypeScript. We compile each $def entry individually
  // so each named type gets exported correctly.
  const defs = schema["$defs"] ?? {};
  const defNames = Object.keys(defs);

  if (defNames.length === 0) {
    console.warn(`  WARN: ${basename(schemaPath)} has no $defs — skipping`);
    return null;
  }

  // Compile the full schema as a module — json-schema-to-typescript will
  // output all $defs as named interfaces.
  const ts = await compile(schema, schema.title ?? "Schema", COMPILE_OPTIONS);

  const outputName = schemaNameToOutputName(schemaPath);
  const outputPath = join(OUTPUT_DIR, outputName);
  await writeFile(outputPath, ts, "utf-8");
  console.log(`  Generated ${outputName} (${defNames.length} types)`);
  return { outputName, defNames };
}

async function generateIndex(results) {
  const lines = [
    "// THIS FILE IS AUTO-GENERATED — DO NOT EDIT BY HAND.",
    "// Source: libs/types/src/platform/*.schema.json",
    "// Regenerate: node scripts/generate-types.mjs",
    "",
  ];

  for (const result of results) {
    if (!result) continue;
    const moduleName = result.outputName.replace(".ts", ".js");
    lines.push(`export * from "./${moduleName}";`);
  }

  lines.push("");
  const indexPath = join(OUTPUT_DIR, "index.ts");
  await writeFile(indexPath, lines.join("\n"), "utf-8");
  console.log("  Generated index.ts");
}

async function main() {
  console.log("Generating TypeScript from JSON Schema files...");
  await ensureOutputDir();

  const schemaFiles = await findSchemaFiles();
  console.log(`  Found ${schemaFiles.length} schema files`);

  const results = [];
  for (const schemaPath of schemaFiles) {
    console.log(`  Processing ${basename(schemaPath)}...`);
    const result = await generateOne(schemaPath);
    results.push(result);
  }

  await generateIndex(results);
  console.log("Done.");
}

main().catch((err) => {
  console.error("Generation failed:", err);
  process.exit(1);
});
