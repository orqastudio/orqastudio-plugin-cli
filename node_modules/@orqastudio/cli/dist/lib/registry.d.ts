/**
 * Plugin registry — fetch and cache official + community plugin catalogs.
 *
 * Both registries are JSON files hosted in GitHub repos.
 * Cached in memory with a 1-hour TTL.
 */
import type { RegistryCatalog, RegistryEntry } from "@orqastudio/types";
/**
 * Fetch a plugin registry catalog.
 *
 * @param source - "official", "community", or "all" (returns merged)
 */
export declare function fetchRegistry(source?: "official" | "community" | "all"): Promise<RegistryCatalog>;
/**
 * Search the registry for plugins matching a query.
 */
export declare function searchRegistry(query: string, source?: "official" | "community" | "all"): Promise<RegistryEntry[]>;
//# sourceMappingURL=registry.d.ts.map