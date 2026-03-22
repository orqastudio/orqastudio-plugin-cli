/* eslint-disable */
// THIS FILE IS AUTO-GENERATED — DO NOT EDIT BY HAND.
// Source: libs/types/src/platform/*.schema.json
// Regenerate: node scripts/generate-types.mjs

/**
 * Integrity check and fix types produced by the schema-driven validation engine.
 */
export type ValidationTypes = IntegrityCheck | AppliedFix;
/**
 * Category of integrity issue found in the artifact graph. Generic categories derived from schema-driven checks — no relationship keys or artifact types are hardcoded.
 */
export type IntegrityCategory =
  | "BrokenLink"
  | "MissingInverse"
  | "TypeConstraintViolation"
  | "RequiredRelationshipMissing"
  | "CardinalityViolation"
  | "CircularDependency"
  | "InvalidStatus"
  | "BodyTextRefWithoutRelationship"
  | "ParentChildInconsistency"
  | "DeliveryPathMismatch"
  | "MissingType"
  | "MissingStatus"
  | "DuplicateRelationship"
  | "FilenameMismatch";
/**
 * Severity of an integrity finding.
 */
export type IntegritySeverity = "Error" | "Warning" | "Info";

/**
 * A single integrity finding from the artifact graph validation run.
 */
export interface IntegrityCheck {
  category: IntegrityCategory;
  severity: IntegritySeverity;
  /**
   * The ID of the artifact with the integrity issue.
   */
  artifact_id: string;
  /**
   * Human-readable description of the integrity issue.
   */
  message: string;
  /**
   * Whether this issue can be automatically fixed.
   */
  auto_fixable: boolean;
  /**
   * Description of the fix that would be applied if auto_fixable is true.
   */
  fix_description?: string | null;
}
/**
 * A fix that was applied to resolve an integrity issue.
 */
export interface AppliedFix {
  /**
   * The ID of the artifact that was fixed.
   */
  artifact_id: string;
  /**
   * Human-readable description of what was changed.
   */
  description: string;
  /**
   * Relative path to the file that was modified.
   */
  file_path: string;
}
