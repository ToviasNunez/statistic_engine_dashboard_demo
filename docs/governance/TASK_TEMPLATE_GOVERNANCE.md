# TASK_TEMPLATE_GOVERNANCE

## Status

- Authority: Authoritative source of truth for enterprise task-template governance in this template.
- Scope: Governs AI-generated implementation task definitions inherited by child repositories derived from this template.
- Effective date: 2026-04-22.
- Version: 1.0.0.

## Purpose

This document defines the mandatory enterprise task-governance model for implementation work. It establishes deterministic task structure, explicit boundaries, verification expectations, and traceability obligations for template-derived repositories.

## Authority And Relationship To Other Files

- This file is authoritative for task-template governance.
- `docs/templates/task-template.md` is the operational derivative template used for day-to-day task creation.
- `.github/copilot-instructions.md`, `AGENTS.md`, and `CLAUDE.md` are enforcement and consumption surfaces; they are not the task-template authority.
- `AI_RULES/*` and `TEMPLATE_INTERNAL/GOVERNANCE_SPEC.md` remain governance-adjacent artifacts; they must not conflict with this task-template authority.

## Design Principles

- Deterministic structure and naming.
- Enterprise traceability and auditable phase boundaries.
- Additive, non-destructive governance evolution.
- Explicit non-regression protection for approved behavior.
- Enforcement-readiness without immediate runtime changes.

## Mandatory Task Schema

All enterprise implementation tasks must include all sections below and preserve section order.

### 1. Task Identity

- `TASK`: Unique phase-scoped task identifier and title.
- `WORKSPACE ROOT`: Absolute repository workspace root used for execution.

### 2. Target Definition

- `TARGET FILES`: Explicit absolute paths for files expected to be created or modified.
- `EXPECTED ARTIFACTS`: Explicit absolute paths for deliverables.

### 3. Context And Intent

- `INPUT CONTEXT`: Implementation context and state assumptions.
- `OBJECTIVE`: Concrete success objective.
- `DEPENDENCIES`: Required prerequisites, or `NONE`.
- `RISK CLASSIFICATION`: One of `LOW`, `MEDIUM`, `HIGH`, with rationale.

### 4. Boundary Controls

- `PHASE BOUNDARY`: Explicit in-scope and out-of-scope actions.
- `PROTECTED COMPLETED BEHAVIOR`: Approved behavior that must remain active.
- `NON-REGRESSION RULES`: Prohibited changes.
- `CHANGE POLICY`: Allowed change style (for example additive-only, no redesign).

### 5. Source-Of-Truth Controls

- `SOURCE OF TRUTH RULES`: Authoritative versus derivative artifact relationship.
- `DUPLICATION HANDLING RULE`: How overlap is identified, preserved, and documented.

### 6. Data And Integrity Controls

- `DATA CONTRACT RULES`: Phase-specific applicability and deterministic documentation rules.
- `DATA INTEGRITY RULES`: Path existence, completeness, and no broken references.
- `IDEMPOTENCY RULES`: Re-run safety and duplicate-blocking expectations.
- `DETERMINISM GUARANTEE`: Same input state produces same structure and references.

### 7. Execution Safety

- `EDIT SAFETY RULES`: Required pre-edit checks.
- `EXECUTION RULES`: Requirements for producing usable artifacts.
- `FAILURE HANDLING RULES`: Conflict handling and safe stop behavior.
- `STOP CONDITIONS`: Conditions requiring halt and report.

### 8. Completion Reporting Contract

- `REQUIRED OUTPUT FORMAT` with exactly:
  1. Short Implementation Report
  2. Execution Evidence
  3. Verification Result
  4. Documentation Update Evidence
  5. Remaining Risks
  6. Rollback Path

### 9. Verification Contract

- `MANDATORY VERIFICATION`: Explicit phase closure checks.
- `ANTI-REGRESSION CHECK`: Explicit confirmation of protected behavior continuity.
- `MANDATORY DOCUMENTATION UPDATE`: Required updates to governed docs with rationale and rollback notes.

## Determinism And Enforceability Requirements

- Section headings in enterprise tasks must match this governance specification.
- Section omission is non-compliant.
- Ambiguous references such as "same as before" are non-compliant where explicit paths or boundaries are required.
- Task instances must remain phase-scoped and repository-specific.
- Any relaxation of required sections requires a new governance version and a documented decision entry.

## Duplication And Migration Policy

If duplicated governance content exists:

1. Identify exact overlap with governance-adjacent artifacts.
2. Preserve this file as authoritative for task-template governance.
3. Preserve stronger non-conflicting governance language.
4. Reduce duplication only if safe and documented.
5. Do not remove historical evidence without documenting why.
6. Do not create multiple competing task-template authorities.

## Non-Goals For Propagation Foundation Phase

- No runtime validator enforcement in this phase.
- No CI gate wiring in this phase.
- No create/sync/migrate/template execution logic changes in this phase.
- No runtime or CLI behavior changes in this phase.

## Planned Enforcement Path (Deferred)

Future phases may add:

- schema-level task validation,
- deterministic lint checks for required sections and order,
- CI enforcement integration,
- explicit governance failure codes.

This deferred path does not change current runtime behavior.

## Change Control

- Change mode: additive by default.
- Any breaking governance revision requires:
  - a decision entry,
  - a project status update,
  - a work log update,
  - migration notes for dependent templates and child repositories.

## Operational Derivative Guarantee

`docs/templates/task-template.md` must:

- stay aligned with this authority,
- preserve required section sequence,
- remain copyable for operational use,
- never weaken requirements relative to this source.
