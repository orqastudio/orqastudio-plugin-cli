/**
 * Dev environment commands — delegates to the debug controller.
 *
 * orqa dev                Start the full dev environment (Vite + Tauri)
 * orqa dev stop           Stop gracefully
 * orqa dev kill           Force-kill all processes
 * orqa dev restart        Restart Vite + Tauri (not the controller)
 * orqa dev restart-tauri  Restart Tauri only
 * orqa dev restart-vite   Restart Vite only
 * orqa dev status         Show process status
 * orqa dev icons          Generate brand icons from SVG sources
 * orqa dev icons --deploy Generate + deploy to app targets
 */
export declare function runDevCommand(args: string[]): Promise<void>;
//# sourceMappingURL=dev.d.ts.map