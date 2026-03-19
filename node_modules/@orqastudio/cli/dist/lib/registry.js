/**
 * Plugin registry — fetch and cache official + community plugin catalogs.
 *
 * Both registries are JSON files hosted in GitHub repos.
 * Cached in memory with a 1-hour TTL.
 */
const OFFICIAL_URL = "https://raw.githubusercontent.com/orqastudio/orqastudio-official-plugins/main/registry.json";
const COMMUNITY_URL = "https://raw.githubusercontent.com/orqastudio/orqastudio-community-plugins/main/registry.json";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const cache = new Map();
/**
 * Fetch a plugin registry catalog.
 *
 * @param source - "official", "community", or "all" (returns merged)
 */
export async function fetchRegistry(source = "all") {
    if (source === "all") {
        const [official, community] = await Promise.allSettled([
            fetchRegistry("official"),
            fetchRegistry("community"),
        ]);
        const officialPlugins = official.status === "fulfilled" ? official.value.plugins : [];
        const communityPlugins = community.status === "fulfilled" ? community.value.plugins : [];
        return {
            version: 1,
            source: "all",
            plugins: [...officialPlugins, ...communityPlugins],
        };
    }
    const url = source === "official" ? OFFICIAL_URL : COMMUNITY_URL;
    // Check cache
    const cached = cache.get(source);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.data;
    }
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${source} registry: ${response.status} ${response.statusText}`);
    }
    const data = (await response.json());
    cache.set(source, { data, fetchedAt: Date.now() });
    return data;
}
/**
 * Search the registry for plugins matching a query.
 */
export async function searchRegistry(query, source = "all") {
    const catalog = await fetchRegistry(source);
    const lower = query.toLowerCase();
    return catalog.plugins.filter((p) => p.name.toLowerCase().includes(lower) ||
        p.displayName.toLowerCase().includes(lower) ||
        p.description.toLowerCase().includes(lower) ||
        p.category.toLowerCase().includes(lower));
}
//# sourceMappingURL=registry.js.map