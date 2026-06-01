# C4 Architecture DSL

This folder is the governed source of truth for architecture-as-code in this repository.

## Purpose

- Track architecture progressively using C4 DSL artifacts.
- Keep architecture changes versioned, reviewable, and auditable.
- Separate architecture DSL from general narrative documentation.

## Scope

- `workspace.dsl`: workspace baseline that references all C4 levels.
- `c1-system-context.dsl`: system context (people, system, external systems).
- `c2-container.dsl`: container architecture (application, storage, integrations).
- `c3-component.dsl`: component architecture where evidence exists.

## Governance Rules

- Maintain C1/C2/C3 incrementally as repository evidence becomes available.
- Do not invent systems, containers, components, or integrations.
- Keep TODO comments until evidence is documented.
- Public-safe publication is only valid after review and explicit approval.

## Future AI Proposal Model

Future Ollama support is proposal-only and user-controlled:

1. Repository evidence is collected.
2. Ollama proposes a C4 DSL delta.
3. repo-ai validates the proposed delta.
4. Human review is recorded in docs/architecture/c4/proposals/c4-review.json.
5. repo-ai may validate review status visibility only.
6. Future bounded apply phase may consume reviewed decisions.
7. repo-ai revalidates contamination and safety constraints.

Ollama is never the source of truth. Repository evidence and approved documentation remain authoritative.

## Current Boundary

- C4 apply is available only through `repo-ai c4 apply` with explicit human-approved change IDs.
- `repo-ai c4 apply --dry-run` is non-mutating and writes no audit record.
- C4 rendering remains unavailable in this phase.
- DSL files remain protected architecture source files with bounded marker-scoped updates only.

## Rendering

Rendered diagrams are a future optional capability. This phase tracks DSL structure only and does not render PNG/SVG outputs.
