# Narrative Proposal Artifacts

This folder is a governed proposal staging area for the narrative layer of docs/PUBLIC_SAFE_SUMMARY.json.

## Purpose

- **Phase 1 (Proposal-Only)**: Generate narrative suggestions from repository evidence with optional Ollama integration
- **Phase 2 (Reviewed Approval)**: Enable human review and selective field-level application to approved metadata
- **Phase 3 (Dedicated CLI Commands)**: Expose governed narrative propose, status, and apply commands directly to operators
- Keep proposal, review, and audit artifacts separate to preserve ownership and accountability

## Workflow

### Phase 1: Proposal Generation

1. repo-ai analyzes repository evidence (README, ARCHITECTURE, workflows, etc.)
2. Optional: Ollama generates narrative suggestions from evidence
3. Artifact created: `narrative-proposal.json`
   - Read-only proposal-only governance: `autoApplyAllowed=false`, `requiresReview=true`
   - No automatic mutation of PUBLIC_SAFE_SUMMARY.json

### Phase 2: Human Review & Selective Apply

1. Human reviewer examines proposal in `narrative-proposal.json`
2. Reviewer sets explicit field-level approvals in `narrative-review.json`
   - Each narrative field (headline, elevatorPitch, executiveSummary, etc.) has explicit approval flag
   - Only approved fields may be applied
3. Selective apply operation executes:
   - For each field: if `approvedFields[field]=true`, apply from proposal; else preserve existing
4. Audit artifact created: `narrative-apply-audit.json`
   - Immutable record of which fields were applied vs. skipped and why
   - Traces approval decisions for accountability

### Phase 3: Dedicated Narrative CLI Workflow

1. `repo-ai narrative propose <repo-path>` generates or refreshes `narrative-proposal.json`
2. `repo-ai narrative status <repo-path>` reports proposal/review/audit state, approvals, pending fields, and apply eligibility
3. Human reviewer still edits `narrative-review.json` directly to approve fields
4. `repo-ai narrative apply <repo-path>` applies only approved fields
5. `repo-ai narrative apply <repo-path> --dry-run` previews the bounded apply plan without mutating metadata or generating audit output

## Artifact Schemas

### narrative-proposal.json

- Contains proposed narrative generated from repository evidence
- Governance locked: `autoApplyAllowed=false`, `requiresReview=true`, `publicSafeApproved=false`
- Created by: `repo-ai narrative propose .` or `repo-ai autopilot . --mode propose`
- Status: proposal-only (read-only until reviewed)

### narrative-review.json (NEW - Phase 2)

- Contains human approval decisions for each narrative field
- Required for selective apply operations
- Template: All fields default to `false` (not approved)
- Reviewer edits this to set `approvedFields[field]=true` for fields to apply
- Governance locked: `fullAutoApplyAllowed=false`, `requiresExplicitApproval=true`
- Created by: `repo-ai sync .` (empty template)
- Edited by: Human reviewer

### narrative-apply-audit.json (NEW - Phase 2)

- Immutable audit trail of apply operations
- Records: which fields were applied, which were skipped, and why
- Created by: `repo-ai narrative apply .`
- Example:
  ```json
  {
    "appliedFields": [
      {
        "field": "headline",
        "approved": true,
        "applied": true,
        "reason": "applied"
      },
      {
        "field": "innovationPoints",
        "approved": true,
        "applied": true,
        "reason": "applied"
      }
    ],
    "skippedFields": [
      {
        "field": "elevatorPitch",
        "approved": false,
        "applied": false,
        "reason": "not-approved"
      },
      {
        "field": "executiveSummary",
        "approved": false,
        "applied": false,
        "reason": "not-approved"
      }
    ],
    "governance": { "boundedApply": true, "fullReplacement": false }
  }
  ```

## Governance Boundaries

### Phase 1 (Proposal-Only)

- No direct write authority to PUBLIC_SAFE_SUMMARY.json
- autoApplyAllowed must remain **false**
- requiresReview must remain **true**
- publicSafeApproved must remain **false**
- Ollama may only suggest narrative, never write metadata

### Phase 2 (Selective Apply)

- Apply only approved fields specified in narrative-review.json
- Preserve all unapproved fields in existing metadata
- No bulk overwrite allowed: `fullReplacement` must remain **false**
- Bounded apply: `boundedApply` must remain **true**
- Audit generation mandatory for all apply operations
- Ownership-preserved: human remains final authority

### Phase 3 (CLI Exposure)

- Dedicated CLI commands do not weaken governance; they only expose the reviewed workflow explicitly
- `repo-ai narrative status` is read-only and reports current governance state
- `repo-ai narrative apply --dry-run` computes the plan, validates governance, and does not write metadata or audit artifacts
- `repo-ai narrative apply` still fails when proposal/review artifacts are missing, governance is invalid, contamination is present, metadata is missing, or no approved fields exist
- Ollama remains proposal-only and is never used for approval, apply, or audit generation

## Governance Boundary

- Narrative proposal artifacts are advisory only until explicit human approval is recorded in `narrative-review.json`.
- Apply operations remain bounded to approved fields and must not perform full metadata replacement.

## Field-Level Apply Rules

For each narrative field:

- **If `approvedFields[field]=true` AND proposal has non-empty value**: Apply from proposal
- **If `approvedFields[field]=false` OR proposal has empty value**: Preserve existing metadata

Example:

```
approvedFields.headline = true  →  Apply proposal headline
approvedFields.elevatorPitch = false  →  Keep existing metadata elevatorPitch
```

## Usage Commands

### Phase 1 / 3: Generate Proposal

```bash
repo-ai narrative propose .
# Creates: docs/proposals/narrative-proposal.json
```

Fallback still available:

```bash
repo-ai autopilot . --mode propose
```

### Phase 2: Create Review Template

```bash
repo-ai sync .
# Creates empty: docs/proposals/narrative-review.json (with all fields=false)
```

### Phase 2: Review & Edit

Manually edit `narrative-review.json` to set field approvals:

```json
{
  "approvedFields": {
    "headline": true, // Will be applied
    "elevatorPitch": false, // Will NOT be applied
    "innovationPoints": true // Will be applied
  }
}
```

### Phase 3: Inspect Narrative State

```bash
repo-ai narrative status .
# Reports:
# - proposal/review/audit presence
# - approved and pending fields
# - proposal vs metadata drift
# - apply eligibility
# - governance state
```

### Phase 3: Apply Approved Fields

```bash
repo-ai narrative apply .
# Creates: docs/proposals/narrative-apply-audit.json
# Updates: docs/PUBLIC_SAFE_SUMMARY.json (only approved fields)
```

### Phase 3: Preview Apply Without Mutation

```bash
repo-ai narrative apply . --dry-run
# Validates governance and shows which fields would be applied or skipped
# Does NOT update docs/PUBLIC_SAFE_SUMMARY.json
# Does NOT generate docs/proposals/narrative-apply-audit.json
```

## Evidence Model

- Proposals must be derived from repository evidence only
- Allowed evidence sources:
  - README.md
  - docs/ARCHITECTURE.md
  - docs/PROJECT_STATUS.md
  - Workflow files (.github/workflows/\*.yml)
  - Manifest-registered documents
  - package.json
- No invented claims, no hidden/private data, no approval escalation

## Validation

```bash
repo-ai validate .
# Checks:
# - Proposal schema valid
# - Review schema valid (if present)
# - Audit schema valid (if present)
# - Governance flags enforced
# - No contamination markers
# - publicSafeApproved still false
```

The dedicated CLI commands are designed to remain inside the same validation envelope:

- `repo-ai narrative propose` writes only proposal artifacts
- `repo-ai narrative status` is read-only
- `repo-ai narrative apply` validates proposal, review, metadata, and bounded audit rules before any write

## Remaining Limitations (Current Phase)

- Review editing remains a human-managed JSON edit; there is no interactive review editor yet
- No automated conflict resolution if proposal and metadata both change
- No narrative version history/rollback (future phase)
- Review workflow not integrated with external systems (GitHub, Slack)

## Future Phases

- **Phase 4**: Batch approval workflows (approve multiple fields at once)
- **Phase 5**: Automated narrative version history and rollback
- **Phase 6**: Integration with PR reviews and approval workflows
