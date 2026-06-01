# Metadata Schema

All lifecycle documents must include YAML frontmatter with the following fields:

```
id: <unique-id>
title: <document-title>
status: <active|archived|...>
version: <semver>
createdAt: <ISO8601>
lastUpdatedAt: <ISO8601>
lastUpdatedBy: <string>
lastReviewedAt: <ISO8601>
reviewStatus: <reviewed|pending|...>
updateStrategy: <incremental|append-only|...>
changeScope: <string>
publicSafeApproved: <true|false>
```

Where freshness tracking is enabled, also include:

```
freshness:
  maxAgeDays: <number>
  status: <valid|stale|critical>
benchmark:
  lastVerifiedAt: <ISO8601>
  lastChangeDetectedAt: <ISO8601>
```

## See this section for the canonical schema. Do not redefine the schema in each lifecycle doc.

id: architecture
title: Architecture
version: 1.0.0
status: active
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

# Architecture

For the canonical project overview, see [../docs/PROJECT_OVERVIEW.md](../docs/PROJECT_OVERVIEW.md).

## System Scope

The `ai-repo-template` and `repo-ai-cli` operate as a coupled system. The template provides the governed source structure. The CLI provides automation and initialization workflows.

## Core Building Blocks

- `AI_RULES/`: Source rule fragments for agent and Copilot instructions
- Generated instruction files: `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`
- Operational lifecycle docs under `docs/`: e.g., `docs/PROJECT_STATUS.md`, `docs/WORK_LOG.md`, etc.
- Structural/reference docs under `docs/`
- Project docs under `docs/projects/`
- CLI command layer for automation
- Profile layer for profile-driven behaviors

## Components

- Template source system (`ai-repo-template`)
- Automation and command execution layer (`repo-ai-cli`)
- Runtime bridge and orchestration surface (`runtime`)

## Rule Generation Flow

- Source rule fragments live under `AI_RULES/`
- Generation produces final instruction outputs for agents and Copilot
- The template sync script and CLI generator must remain aligned
- The governance rule source is part of the generation chain

## Initialization Model

- `repo-ai init` is the governed initialization path
- It relies on the document manifest for file selection and classification
- Operational lifecycle docs are initialized fresh with governed metadata
- Prior project history must not be copied into new projects

## Documentation Layout

- Repository root: operational lifecycle docs
- `docs/`: structural and reference docs
- `docs/projects/`: project-specific docs

## 6. Profiles

- Supported profile concept exists
- Profile definitions in template and CLI must remain aligned
- Profile drift is not allowed

## 7. Coupling and Constraints

- Template and CLI are coupled
- Manifest dependency exists for initialization and validation
- Generators must remain synchronized
- Portability constraints exist if paths are hardcoded

## 8. Current Non-Goals

- The system is not yet a fully independent published CLI product
- It remains a tightly coupled governed template system
- Workflow policy is documented and enforced (see below).

## Validation Model

The system uses two distinct validators with non-overlapping scopes.

### scripts/validator.mjs — Template Integrity Validator

- Scope: runs inside the **template repository** to verify its own structural integrity.
- Checks: required files present, YAML frontmatter fields complete, `templateVersion` matches `STANDARD_VERSION`, `inheritsOperationalHistory: false`, governed doc metadata valid, Layer column present in manifest, no MODULE files misclassified as REQUIRED.
- Run via `npm run validate` from the template directory.
- Findings are always errors — failures block acceptance.

### repo-ai-cli lib/commands/validate.js — Instance Compliance Validator

- Scope: runs against **repository instances** created from the template (or any governed repo).
- Checks: `.git` present, `.repo-ai.json` valid, all 13 `REQUIRED_BASELINE_FILES` present, generated files in sync with current AI_RULES, `claude-governance.md` has a `version:` field, all `.github/workflows/*.yml` files registered in `docs/DOCUMENT_MANIFEST.md`.
- Invoked by CLI commands (`init`, `migrate`, `normalize`, `upgrade`, `create`, `migrate-all`) post-operation and available as `repo-ai validate <path>`.
- All findings are errors — failures set `process.exitCode = 1` and block command success.

### repo-ai-cli lib/commands/doctor.js — Interactive Health Inspector

- Scope: same target as `validate.js` (repository instances), but output is advisory.
- **Errors** (same as validate): missing required files, not a git repository.
- **Warnings** (never in validate): out-of-sync generated files, missing/invalid `.repo-ai.json`, `REVIEW_REQUIRED` markers in governed docs.
- Use `doctor` for interactive repository health inspection during development.
- Use `validate` in CI and post-command hooks where strict pass/fail is required.
- `doctor` exit code is always 0 even when warnings are present; `validate` exits 1 on any finding.

## Public-Safe Separation

- Public-safe summaries are maintained in PUBLIC_SAFE_SUMMARY.md.
- Internal and public-safe documentation are strictly separated.
- No confidential or sensitive information may be exposed in public-safe outputs.

## Cloudflare R2 Publishing Pipeline

Repo-ai managed repositories publish approved public metadata to Cloudflare R2 as a manual-only workflow.

### Responsibility split

- Repo responsibility: create metadata, validate metadata, render C4 architecture assets, and publish approved public artifacts to R2.
- R2 responsibility: host versioned JSON and SVG artifacts under stable object keys.
- Backend responsibility: consume the static metadata, validate/cache/normalize/process it, and expose API endpoints.
- cv_web_profile responsibility: consume backend APIs and render the dashboard UI.

### Publishing boundary

- Publishing is manual-only and triggered by GitHub Actions `workflow_dispatch`.
- The canonical publish target is Cloudflare R2, accessed through Wrangler R2 commands.
- Shared organization-level secrets are `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `R2_BUCKET_NAME`.
- The publish workflow remains manual-only, and a GitHub Environment gate may be added later if required.
- Published object keys use `repos/<repo-name>/...`.
- `docs/PUBLIC_SAFE_SUMMARY.json` is required; C4 render manifest and SVGs are optional if present.
- `publicSafeApproved` must remain human-set and must never be auto-approved by repo-ai.
- If rendered C4 assets are missing, the publish plan remains metadata-only and emits a warning instead of failing.
- S3-compatible access may remain an internal compatibility detail, but it is not the governing publish contract.

### Repository boundary

- Repositories publish static metadata only.
- Repositories do not aggregate metadata.
- Repositories do not expose APIs.
- Repositories do not orchestrate dashboards.

## Known Limitations

- Content-quality validation is not yet fully automated.
- Quality scoring, coverage, and confidence markers are planned but not enforced.
- Human review is still required for major structural or policy changes.

## Trade-Offs

- **Simplicity vs. Strict Enforcement**: The template prioritizes governance and traceability over ease of ad-hoc changes.
- **Template Flexibility vs. Governance Control**: Strict policies may limit flexibility but ensure compliance and auditability.
- **Structural Validation vs. Content-Quality Validation**: Current validation focuses on structure and metadata, not content quality.

## Workflow Policy Summary

Allowed by default:

- CI-only workflows for validation, linting, tests, and build verification
- Manual-only public metadata publishing workflow that writes approved JSON/SVG artifacts to Cloudflare R2

Not allowed by default in the baseline template:

- production deployment workflows
- auto-publish workflows
- release-to-production automation
- documentation publication workflows exposing repository content externally

Such workflows must be classified as NEEDS REVIEW or EXCLUDED / REMOVE FROM TEMPLATE, except for the manual-only public metadata publishing workflow, which is a governed baseline exception because it stops at static storage and does not run on push, pull_request, or schedule.

## Dependency Overview

- **AI_RULES/** → all generated instruction files
- **.repo-ai.json** → sync and validator behavior
- **governance schema changes** → all governed operational docs
- **example-project docs** → example-only, non-operational usage
- **validator changes** → CI and local validation expectations

## Data / Instruction Lineage

- **source** (AI_RULES/, .repo-ai.json, docs/) → **transform** (sync/validator scripts) → **output** (generated instructions, validated docs) → **consumer** (AI agents, Copilot, maintainers)

## Future Evolution

- Planned extensions: qualityScore, coverageLevel, confidence markers for governed docs.
- Enhanced content-quality validation and reporting.
- Automated drift detection and notification.
- Improved public-safe abstraction and sanitization tooling.

## Template Layering and Modules

The template system is divided into three conceptual layers:

- **CORE**: Mandatory baseline. Includes all governance, rules, validation, and operational documentation. Must be present in every generated repository.
- **MODULES**: Optional enterprise features (e.g., deployment, release, publish workflows, advanced validation). Modules are not included by default, must be explicitly activated, and are independently removable. Deploy workflows are not default to prevent uncontrolled automation and risk.
- **EXAMPLES**: Non-operational references (e.g., example project profiles, demonstration data). Never treated as live data or copied as real content.

Modules require explicit activation to avoid accidental automation or policy violations. This separation ensures that the template remains stable, predictable, and safe for enterprise use. Uncontrolled automation is avoided by requiring all non-core features to be opt-in only.
