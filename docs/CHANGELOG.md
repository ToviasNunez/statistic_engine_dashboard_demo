# [2026-04-15]

### Added

- Template-only document registry system completed (TEMPLATE_INTERNAL/document-id-registry.json)
- Stable UUID-based document identity: IDs are assigned once per docKey+path and never change on metadata update
- Repository title (repoName) and document title stored per entry; updateable without ID change
- Template-only propagation block: TEMPLATE_INTERNAL/document-id-registry.json never reaches child repos
- Validation hardened: child-repo registry presence → FAIL; duplicate IDs → FAIL; duplicate docKey+path → FAIL
- 22 automated tests covering all registry lifecycle scenarios

### Added

- Added propagationPolicy system to .repo-ai.json
- Added content sanitization before propagation to child repositories
- Added baseline-safe document initialization for governed files

# CHANGELOG.md

## [2026-04-15]

### Added

- Introduced TEMPLATE_INTERNAL/GOVERNANCE_SPEC.md as the internal governance master specification for the template system.
- Strengthened internal template governance definition and documentation path enforcement.
- No root-level governed file duplication allowed; all governed documentation must reside at official paths only.---
  id: changelog
  title: Changelog
  version: 1.0.0
  status: draft
  createdAt: 2026-04-14
  lastUpdatedAt: 2026-04-14T00:00:00Z
  lastUpdatedBy: ai-initializer
  lastReviewedAt:
  reviewStatus: valid
  updateStrategy: incremental
  changeScope: initial
  freshness:
  maxAgeDays: 7
  status: valid
  benchmark:
  lastVerifiedAt:
  lastChangeDetectedAt:
  publicSafeApproved: false
  templateOrigin: repo-ai-template
  templateVersion: 1.0.0
  instanceInitialized: true
  instanceInitializedAt: 2026-04-14T00:00:00Z
  inheritsOperationalHistory: false

---

# CHANGELOG

## [2026-04-14]

### Initialized

- repository instance created from governed template
- template structure inherited
- template operational history not inherited

## Releases

- Use this section to track versioned release notes over time.

---
