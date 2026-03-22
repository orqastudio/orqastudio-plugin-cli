/**
 * Audit command — full governance audit.
 *
 * orqa audit [--fix]
 *   Runs: integrity validation (with optional --fix), version drift, license audit, readme audit.
 *   Exits non-zero if any check fails.
 *
 * orqa audit escalation [--json] [--create-tasks]
 *   Scans lessons for escalation candidates and creates CRITICAL task artifacts.
 *
 *   Detection rules:
 *     - Lesson recurrence >= 3 and status != promoted → [PROMOTE] finding
 *     - Lesson recurrence >= 3 and promoted-to rule exists:
 *         - If rule has no enforcement_updated → [STRENGTHEN] finding
 *         - If rule has enforcement_updated and lesson recurrence >= 3 post-update → [STRENGTHEN] finding
 *
 *   --create-tasks always creates artifacts for every finding found.
 *   In the stop hook, --create-tasks is always passed so tasks are created immediately.
 */
export declare function runAuditCommand(args?: string[]): Promise<void>;
//# sourceMappingURL=audit.d.ts.map