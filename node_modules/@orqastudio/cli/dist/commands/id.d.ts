/**
 * ID management command — generate, check, and migrate artifact IDs.
 *
 * orqa id generate <type>        Generate a new hex ID
 * orqa id check                  Scan graph for duplicate IDs
 * orqa id migrate <old> <new>    Rename an ID across the entire graph
 */
export declare function runIdCommand(args: string[]): Promise<void>;
//# sourceMappingURL=id.d.ts.map