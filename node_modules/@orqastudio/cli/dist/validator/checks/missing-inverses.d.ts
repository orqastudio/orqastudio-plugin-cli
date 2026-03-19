import type { ArtifactGraph, IntegrityFinding, CheckContext } from "../types.js";
/**
 * Check for relationship edges missing their bidirectional inverse.
 *
 * Only checks relationships that are structurally valid (known vocabulary,
 * target resolves, from/to constraints pass). Invalid relationships are
 * already caught by VocabularyCompliance and RelationshipConstraint —
 * flagging a missing inverse for a relationship that shouldn't exist
 * in the first place would be misdirection.
 */
export declare function checkMissingInverses(graph: ArtifactGraph, ctx: CheckContext): IntegrityFinding[];
//# sourceMappingURL=missing-inverses.d.ts.map