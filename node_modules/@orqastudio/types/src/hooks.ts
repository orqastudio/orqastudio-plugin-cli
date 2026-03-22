/**
 * Canonical hook lifecycle types.
 *
 * These define the platform's hook model. Connectors map native events
 * (Claude Code PreToolUse, VS Code onDidSave, etc.) to these canonical types.
 * The Rust engine evaluates hooks using these types.
 */

/** Canonical hook event types — platform-defined, connector-mapped. */
export type CanonicalHookEvent =
	| "PreAction"
	| "PostAction"
	| "PromptSubmit"
	| "PreCompact"
	| "SessionStart"
	| "SessionEnd"
	| "SubagentStop"
	| "PreCommit";

/** Context passed to the hook engine for evaluation. */
export interface HookContext {
	event: CanonicalHookEvent;
	tool_name?: string;
	tool_input?: unknown;
	file_path?: string;
	user_message?: string;
	agent_type?: string;
}

/** Result from the hook engine after evaluating rules. */
export interface HookResult {
	action: "allow" | "block" | "warn";
	messages: string[];
	violations: HookViolation[];
}

/** A single rule violation found during hook evaluation. */
export interface HookViolation {
	rule_id: string;
	action: string;
	message: string;
}
