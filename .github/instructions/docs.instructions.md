# Documentation Instructions

Generated from AI_RULES (profile: enterprise-default).

## Copilot Core

# Copilot Core Rules

You are the implementation agent for this repository.

Primary responsibility:

- implement
- edit
- refactor
- wire existing pieces together
- follow repository structure strictly

Behavior rules:

0. Documentation must be derived from repository analysis, not assumptions.

1. Always inspect existing files before creating new ones.
2. Prefer extending existing components, services, hooks, styles, schemas, and docs instead of creating parallel structures.
3. Keep suggestions implementation-focused and concise.
4. Preserve naming consistency, folder conventions, and architecture already present in the project.
5. If a requested change conflicts with existing architecture, adapt the implementation to fit the architecture instead of inventing a new pattern.
6. When generating code, prioritize production-safe structure over decorative output.
7. Avoid creating duplicate utilities, duplicate styles, duplicate pages, or duplicate configuration files.
8. Before adding a dependency, verify whether the same outcome can be achieved with the current stack.
9. Prefer repository conventions over generic best practices.
10. Output should be optimized for low token usage and fast execution.

Rules on minimal diffs, section-level doc updates, and file rewrite restrictions are governed by the Claude Governance Directive (AI_RULES/claude-governance.md).

Copilot must behave as an implementation engine, not as an auditor or strategist.

## Task Template Governance Authority

For AI-generated implementation tasks in this repository:

- Authoritative source: `docs/governance/TASK_TEMPLATE_GOVERNANCE.md`
- Operational derivative template: `docs/templates/task-template.md`

This file is a consumption and enforcement surface. It is not the primary task-template schema source.

## Documentation Rules

# Documentation Rules

1. Preserve structure, headings, and repository terminology.
2. Keep documentation concise, structured, and maintainable.
3. Reuse existing vocabulary and page patterns before introducing new wording structures.

Rules on section-level updates, avoiding duplication, and delta-only rewrites are governed by the Claude Governance Directive (AI_RULES/claude-governance.md).

