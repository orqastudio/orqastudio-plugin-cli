/**
 * Core types for the OrqaStudio integrity checker.
 *
 * ArtifactNode, ArtifactRef, and ArtifactGraph use camelCase field names
 * (the integrity validator's convention). This differs from @orqastudio/types
 * which uses snake_case to match Rust/Tauri IPC serialisation. The shapes are
 * intentionally local — the validator builds its own graph from disk, not from
 * IPC responses.
 *
 * buildInverseMap is imported from @orqastudio/types to keep a single source of truth.
 */
// Re-export from @orqastudio/types (single source of truth)
export { buildInverseMap, hasSemantic, keysForSemantic, PLATFORM_CONFIG, PLATFORM_SEMANTICS } from "@orqastudio/types";
//# sourceMappingURL=types.js.map