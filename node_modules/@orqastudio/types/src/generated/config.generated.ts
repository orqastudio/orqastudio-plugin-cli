/* eslint-disable */
// THIS FILE IS AUTO-GENERATED — DO NOT EDIT BY HAND.
// Source: libs/types/src/platform/*.schema.json
// Regenerate: node scripts/generate-types.mjs

/**
 * Project settings, plugin configuration, and delivery configuration types.
 */
export type ConfigurationTypes =
  | ProjectSettings
  | ArtifactTypeConfig
  | DeliveryTypeConfig
  | ProjectRelationshipConfig
  | ChildProjectConfig
  | StatusDefinition
  | PluginProjectConfig
  | undefined;
/**
 * An entry in the artifacts config — either a direct type or a group of types.
 */
export type ArtifactEntry = ArtifactGroup | ArtifactTypeConfig;

/**
 * Minimal project settings loaded from {project}/.orqa/project.json.
 */
export interface ProjectSettings {
  /**
   * Project display name.
   */
  name: string;
  /**
   * Whether this is an organisation-mode project with child projects.
   */
  organisation?: boolean;
  /**
   * Child project references (only used when organisation is true).
   */
  projects?: ChildProjectConfig[];
  /**
   * Artifact type navigation configuration.
   */
  artifacts?: ArtifactEntry[];
  /**
   * Valid status definitions for this project.
   */
  statuses?: StatusDefinition[];
  delivery?: DeliveryConfig;
  /**
   * Project-level relationship types beyond the core platform relationships.
   */
  relationships?: ProjectRelationshipConfig[];
  /**
   * Plugin configurations keyed by plugin name.
   */
  plugins?: {
    [k: string]: PluginProjectConfig | undefined;
  };
  [k: string]: unknown | undefined;
}
/**
 * A child project reference in an organisation-mode project.
 */
export interface ChildProjectConfig {
  /**
   * Logical name for this child project.
   */
  name: string;
  /**
   * Absolute or relative path to the child project root.
   */
  path: string;
}
/**
 * A grouped collection of artifact types.
 */
export interface ArtifactGroup {
  key: string;
  label?: string | null;
  icon?: string | null;
  children: ArtifactTypeConfig[];
}
/**
 * A single artifact type with a filesystem path to scan.
 */
export interface ArtifactTypeConfig {
  /**
   * Artifact type key matching platform artifact types.
   */
  key: string;
  /**
   * Display label for this type.
   */
  label?: string | null;
  /**
   * Lucide icon name.
   */
  icon?: string | null;
  /**
   * Relative directory path within .orqa/ to scan for this type.
   */
  path: string;
}
/**
 * A status definition loaded from project.json.
 */
export interface StatusDefinition {
  /**
   * Unique status key (lowercase).
   */
  key: string;
  /**
   * Human-readable label.
   */
  label: string;
  /**
   * Lucide icon name.
   */
  icon: string;
  /**
   * Whether to animate the icon with a spin effect.
   */
  spin?: boolean;
  /**
   * Valid next status keys from this status.
   */
  transitions?: string[];
}
/**
 * Delivery hierarchy configuration.
 */
export interface DeliveryConfig {
  /**
   * Ordered list of delivery type definitions.
   */
  types: DeliveryTypeConfig[];
}
/**
 * A single delivery type defined in project.json.
 */
export interface DeliveryTypeConfig {
  /**
   * Unique delivery type key.
   */
  key: string;
  /**
   * Human-readable label.
   */
  label: string;
  /**
   * Relative directory path within .orqa/ for this delivery type.
   */
  path: string;
  parent?: DeliveryParentConfig | null;
  /**
   * Frontmatter field used as the gate condition for status promotion.
   */
  gate_field?: string | null;
}
/**
 * The parent relationship config for a delivery type.
 */
export interface DeliveryParentConfig {
  /**
   * The parent artifact type key.
   */
  type: string;
  /**
   * Relationship type connecting child to parent.
   */
  relationship: string;
}
/**
 * A project-level relationship type defined in project.json.
 */
export interface ProjectRelationshipConfig {
  /**
   * Relationship type key (lowercase, hyphenated).
   */
  key: string;
  /**
   * Inverse relationship type key.
   */
  inverse: string;
  /**
   * Human-readable label for the forward direction.
   */
  label: string;
  /**
   * Human-readable label for the inverse direction.
   */
  inverse_label: string;
}
/**
 * Per-plugin configuration stored in project.json under 'plugins.<name>'.
 */
export interface PluginProjectConfig {
  /**
   * Whether the plugin has been installed.
   */
  installed: boolean;
  /**
   * Whether the plugin is currently active.
   */
  enabled: boolean;
  /**
   * Absolute or relative path to the plugin root.
   */
  path: string;
  /**
   * Map of relationship key → enabled boolean for plugin-provided relationships.
   */
  relationships?: {
    [k: string]: boolean | undefined;
  } | null;
  /**
   * Plugin-specific configuration values.
   */
  config?: {
    [k: string]: unknown | undefined;
  } | null;
}
