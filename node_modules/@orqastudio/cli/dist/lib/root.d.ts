/**
 * Resolve the OrqaStudio project root directory.
 *
 * Resolution order:
 * 1. ORQA_ROOT environment variable (explicit override)
 * 2. Walk up from cwd looking for .orqa/ directory (project detection)
 * 3. Fall back to cwd
 */
export declare function getRoot(): string;
//# sourceMappingURL=root.d.ts.map