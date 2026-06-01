# C4 Proposal Artifacts

This folder stores proposal-only C4 architecture updates for governed repositories.

## Purpose

- Stage architecture-as-code suggestions without mutating approved DSL files.
- Keep architecture proposals auditable and bounded to repository evidence.

## Governance Boundary

- Proposals are advisory and must stay proposal-only.
- directDslWriteAllowed must remain false.
- autoApplyAllowed must remain false.
- diagramRenderingRequested must remain false.
- Human review decisions are tracked in c4-review.json and remain human-controlled.
- No repo-ai command in this phase may apply proposal content to DSL files.

## Evidence Model

- Use only managed repository evidence and manifest-registered files.
- Do not invent systems, queues, databases, or external integrations.
- Do not include secrets, credentials, private hostnames, or private IPs.

## Future Phases

- Future phases may add bounded apply flows that consume reviewed decisions.
- Future phases may add rendering workflows under separate governance.

