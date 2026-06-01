# Public Metadata Consumer Contract

## Purpose

This document defines the official consumer boundary for external dashboards (for example `cv_web`) that read repository metadata from `docs/PUBLIC_SAFE_SUMMARY.json`.

The contract guarantees a stable, public-safe, governed export surface and defines how consumers map metadata into dashboard cards and project detail views.

## Contract Version

- Contract name: `public-metadata-consumer-contract`
- Contract version: `1.0.0`
- Summary schema anchor: `docs/PUBLIC_SAFE_SUMMARY.json` `schemaVersion`
- Compatibility model: additive-only changes for minor updates; breaking changes require major version increment.

## Source File

- Canonical source file: `docs/PUBLIC_SAFE_SUMMARY.json`
- Producer: `repo-ai` governed pipeline
- Consumer examples: `cv_web` and equivalent portfolio/dashboard systems
- Producer-side static publication target: S3-compatible object storage under `repos/<repo-name>/...`
- Backend services consume the static publication target; `cv_web_profile` consumes backend APIs rather than static storage directly

## Required Fields

The following fields are required for consumer compatibility:

- `schemaVersion`
- `project.id`
- `project.slug`
- `project.title`
- `project.description`
- `project.status`
- `project.year`
- `project.featured`
- `project.completionPercent`
- `classification.domain`
- `classification.category`
- `classification.complexity`
- `classification.scope`
- `dashboard.href`
- `dashboard.previewLabel`
- `dashboard.actionLabel`
- `dashboard.visualVariant`
- `dashboard.cardSize`
- `dashboard.tags`
- `dashboard.blocks`
- `engineering.focusAreas`
- `engineering.systemCharacteristics`
- `narrative.headline`
- `narrative.elevatorPitch`
- `narrative.executiveSummary`
- `narrative.differentiators`
- `narrative.innovationPoints`
- `narrative.professionalHighlights`
- `architecture.c4.workspace`
- `architecture.c4.c1SystemContext`
- `architecture.c4.c2Container`
- `architecture.c4.c3Component`
- `governance.publicSafeApproved`
- `governance.sourceConfidence`
- `governance.reviewStatus`

## Optional Fields

Consumers may read but must not require these fields:

- `timeline.lastReviewedAt`
- `timeline.publishedAt`
- `references.*`
- unknown future additive fields

Consumer rule: ignore unknown fields safely.

## Dashboard Field Mapping

`PUBLIC_SAFE_SUMMARY.json` -> `ProjectItem` minimum mapping:

- `project.id` -> `id`
- `project.slug` -> `slug`
- `project.title` -> `title`
- `project.description` -> `description`
- `project.status` -> `status`
- `project.year` -> `year`
- `project.featured` -> `featured`
- `classification.domain` -> `domain`
- `classification.category` -> `category`
- `classification.complexity` -> `complexity`
- `classification.scope` -> `scope`
- `dashboard.href` -> `href`
- `dashboard.previewLabel` -> `previewLabel`
- `dashboard.actionLabel` -> `actionLabel`
- `dashboard.visualVariant` -> `visualVariant`
- `dashboard.cardSize` -> `cardSize`
- `dashboard.tags` -> `tags`
- `engineering.focusAreas` -> `engineeringFocus`
- `engineering.systemCharacteristics` -> `systemCharacteristics`
- `dashboard.blocks` -> `blocks`
- `narrative.headline` -> `card headline` or `project subtitle`
- `narrative.elevatorPitch` -> `card supporting copy`

## Project Detail Mapping

Recommended detail-page mapping:

- `narrative.executiveSummary` -> executive summary section
- `narrative.differentiators` -> differentiators list
- `narrative.innovationPoints` -> innovation highlights
- `narrative.professionalHighlights` -> achievements or outcomes
- `architecture.c4.*` -> architecture source links
- `governance.sourceOfTruth.*` -> evidence provenance references

## Status and Completion Mapping

Recommended normalized display behavior:

- `project.status`: display as-is (`draft`, `active`, `paused`, `done`, etc.)
- `project.completionPercent`: display as bounded numeric percentage
- Missing or non-numeric completion values must fall back to `0`

## Narrative Mapping

Narrative fields are governed and public-safe; consumers should:

- prioritize `headline` for list/card contexts
- use `elevatorPitch` for compact views
- use `executiveSummary` for full detail views
- render list fields only when non-empty

## Architecture and C4 Mapping

- `architecture.c4.workspace` -> workspace DSL path
- `architecture.c4.c1SystemContext` -> C1 DSL path
- `architecture.c4.c2Container` -> C2 DSL path
- `architecture.c4.c3Component` -> C3 DSL path
- `architecture.c4.available.*` -> optional display gating for architecture links

Consumers should treat path strings as repository-relative references.

## Public-Safe Approval Behavior

`governance.publicSafeApproved` controls publication strictness:

- `true`: consumer may treat content as approved for normal public display
- `false`: consumer must treat content as unapproved and apply conservative display policy

Recommended conservative policy when `false`:

- allow internal preview surfaces
- prevent promotion to public featured lists
- display an explicit "not yet approved" badge or equivalent state indicator

## Fallback Behavior

Consumers must remain resilient when data is incomplete:

- missing strings -> display neutral placeholder (`Field not yet documented` or consumer equivalent)
- missing arrays -> use empty arrays
- missing booleans -> default `false`
- missing numeric completion -> default `0`
- missing optional fields -> omit section silently

Consumers must never infer approval, capabilities, or claims not present in the export.

## Validation Expectations

Producer-side expectations (`repo-ai validate`):

- schema/object shape validation
- required consumer path presence validation
- governance field validation
- bounded public-safe narrative structure validation
- contamination detection

Consumer-side expectations:

- validate minimum required paths before rendering production cards
- fail safely (degrade display, do not crash) when fields are missing

## Consumer Responsibilities

External consumer systems must:

- read only public-safe exported metadata
- avoid reading internal/private repository data as source-of-truth replacement
- preserve public-safe gating in UI behavior
- treat this contract as authoritative over ad-hoc repository scraping
- prefer backend APIs over raw static storage for application runtime data flow
- treat static storage as a publication target, not the dashboard runtime boundary

## Compatibility and Versioning

Versioning rules:

- additive fields are backward-compatible
- removing or renaming required fields is breaking
- changing semantic meaning of existing required fields is breaking
- breaking changes require new major contract version and migration guidance

Consumer guidance:

- pin to known contract version behavior
- ignore unknown additive fields
- implement tolerant parsing with strict minimum required field checks
