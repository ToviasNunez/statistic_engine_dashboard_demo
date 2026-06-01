---
id: decisions
title: Decisions
version: 1.0.0
status: draft
createdAt: 2026-04-14
lastUpdatedAt: 2026-04-22T00:00:00Z
lastUpdatedBy: github-copilot
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

# DECISIONS

No repository-instance decisions have been recorded yet.

## [2026-04-22] PHASE T1A — AI-REPO-TEMPLATE Governance Propagation Foundation Decisions

### Rationale

- Child repositories derived from this template require an inheritable, in-repository source of truth for task-template governance.
- Existing governance-adjacent artifacts provide broad governance behavior but do not serve as a dedicated task-template authority under `/docs`.
- This phase is intentionally scoped to propagation and instruction alignment with low risk.

### Decisions

- Decision: establish `docs/governance/TASK_TEMPLATE_GOVERNANCE.md` as the authoritative task-template governance source for template-derived repositories.
  - Basis: single authority is required for deterministic inheritance and future enforcement.
- Decision: establish `docs/templates/task-template.md` as an operational derivative template.
  - Basis: daily task creation requires a copy-ready template aligned to authority.
- Decision: explicitly align `.github/copilot-instructions.md`, `AGENTS.md`, and `CLAUDE.md` to the same authority.
  - Basis: assistant surfaces must point to one governance source and avoid conflicting interpretations.
- Decision: preserve `AI_RULES/*` and `TEMPLATE_INTERNAL/GOVERNANCE_SPEC.md` as governance-adjacent artifacts without redefining them as task-template authority.
  - Basis: maintain historical governance context while preventing competing authorities.
- Decision: defer runtime validator wiring, CI/CD enforcement, and template execution logic changes to later phases.
  - Basis: phase boundary is documentation and instruction propagation only.

### Consequences

- Future child repositories can inherit a deterministic task-template governance source directly inside docs.
- Assistant instruction files now consume the same source-of-truth path, reducing drift risk.
- No runtime, CLI, create/sync/migrate, or template execution behavior changed in this phase.
- Rollback remains docs/instructions-only and does not require runtime or data-plane rollback.

## [2026-05-15] PHASE B — Cloudflare R2 Native Publishing and Shared Org Secrets

### Rationale

- Governed repositories need one centralized publishing credential strategy.
- Cloudflare R2 is the preferred native storage target for public metadata artifacts.
- Repository-local secret duplication increases drift and operational risk.

### Decisions

- Decision: use organization-level secrets for public metadata publishing.
  - Basis: centralizes credential management and avoids per-repository duplication.
- Decision: standardize on `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `R2_BUCKET_NAME` as the shared secret names.
  - Basis: keeps publishing aligned to Cloudflare terminology and R2-native operations.
- Decision: keep the public metadata publish workflow manual-only and bounded to the approved JSON/SVG allowlist.
  - Basis: preserves governance, human approval, and static-metadata-only behavior.
- Decision: keep the publish workflow manual-only for now; add a GitHub Environment boundary only if approval gating becomes necessary.
  - Basis: allows stronger approval gates without changing the workflow trigger model.

### Consequences

- Publish workflows no longer depend on repository-local credential duplication.
- Cloudflare R2 becomes the canonical storage term in repository documentation.
- Manual approval remains the authority boundary for publicSafeApproved and artifact publication.

---
