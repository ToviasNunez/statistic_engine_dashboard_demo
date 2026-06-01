# Enterprise Task Template

Use this template for all AI-generated implementation tasks in repositories derived from this template.
Authoritative governance source: `docs/governance/TASK_TEMPLATE_GOVERNANCE.md`.

## TASK

PHASE <ID> - <TITLE>

## WORKSPACE ROOT

<ABSOLUTE WORKSPACE PATH>

## TARGET FILES

- <ABSOLUTE PATH 1>
- <ABSOLUTE PATH 2>

## INPUT CONTEXT

<Current phase context, repository state, and constraints>

## OBJECTIVE

<Concrete objective and completion definition>

## EXPECTED ARTIFACTS

- <ABSOLUTE PATH 1>
- <ABSOLUTE PATH 2>

## DEPENDENCIES

<NONE or explicit dependencies>

## RISK CLASSIFICATION

<LOW|MEDIUM|HIGH>

- <Rationale line 1>
- <Rationale line 2>

## PHASE BOUNDARY

In scope:

- <Allowed action 1>
- <Allowed action 2>

Out of scope:

- <Deferred action 1>
- <Deferred action 2>

## ENTERPRISE GOVERNANCE MODEL

This task operates under the layered enterprise governance model and must preserve determinism, structure, and future enforceability.

## PROTECTED COMPLETED BEHAVIOR

- <Approved behavior that must remain active>
- <Approved output or contract that must remain active>

## NON-REGRESSION RULES

- DO NOT <forbidden change 1>
- DO NOT <forbidden change 2>
- DO NOT <forbidden change 3>

## CHANGE POLICY

- minimal, coherent, scoped changes only
- additive over destructive
- no redesign
- no broad refactor
- no speculative cleanup

## SOURCE OF TRUTH RULES

- `docs/governance/TASK_TEMPLATE_GOVERNANCE.md` is authoritative.
- `docs/templates/task-template.md` is operational derivative.
- Assistant instruction files are consumption and enforcement surfaces, not authority.

## DUPLICATION HANDLING RULE

If overlap exists:

1. Identify exact overlap.
2. Preserve authoritative source.
3. Preserve stronger non-conflicting governance.
4. Reduce duplication only if safe and documented.
5. Keep historical evidence.
6. Do not create competing authorities.

## DATA CONTRACT RULES

- Not applicable to persistence in this phase unless explicitly stated.
- Documentation and instruction content must still be deterministic and complete.
- Assistant-facing references must point to existing files.

## DATA INTEGRITY RULES

- Governance files must not be partially created.
- Referenced paths must exist after execution.
- Documentation updates must reflect actual introduced files.
- No broken references allowed.

## IDEMPOTENCY RULES

- Re-running the phase must not create duplicate governance sections.
- Paths and headings must remain deterministic.
- Existing content should be extended safely, not duplicated.

## DETERMINISM GUARANTEE

- Same repository state should produce the same governance files and references.
- No hidden dependency on unstored context.
- No random wording beyond normal chronology entries.

## EDIT SAFETY RULES

Before editing:

- inspect docs structure
- inspect assistant instruction files
- inspect governance-adjacent artifacts for overlap
- identify exactly what is added, changed, and preserved
- do not remove content without proven equivalence

## EXECUTION RULES

- produce real repository artifacts
- avoid analysis-only outcomes
- ensure instruction references point to authoritative source
- keep inheritance intent explicit for child repositories
- keep existing assistant instruction content usable

## FAILURE HANDLING RULES

- do not ignore contradictory governance sources
- if contradictions cannot be bounded safely, stop and report exact conflicts
- do not leave partial propagation with inconsistent references

## REQUIRED OUTPUT FORMAT

1. Short Implementation Report
2. Execution Evidence
3. Verification Result
4. Documentation Update Evidence
5. Remaining Risks
6. Rollback Path

## MANDATORY VERIFICATION

Verify:

1. governance files exist under docs
2. assistant instruction files reference governance authority
3. no conflicting authority was introduced
4. no runtime or template propagation logic changed
5. documentation reflects real evidence
6. no secrets or access values were introduced

## ANTI-REGRESSION CHECK

Explicitly confirm:

- no protected logic removed
- phase boundary respected
- no runtime/template propagation logic changed
- governance authority lives under docs/governance
- instruction surfaces point to that authority
- no second conflicting authority introduced

## MANDATORY DOCUMENTATION UPDATE

Update at minimum:

- docs/PROJECT_STATUS.md
- docs/WORK_LOG.md
- docs/DECISIONS.md

Include:

- what governance files were added
- why child repositories need these files in-template
- what instruction files were updated
- what was verified
- what was intentionally not changed
- deferred enforcement steps
- rollback path

## STOP CONDITIONS

Stop and report if:

- conflicting authoritative governance exists and equivalence is unclear
- instruction sections cannot be safely extended
- propagation would create contradictory inheritance rules
- required edits spill into runtime or template execution logic
