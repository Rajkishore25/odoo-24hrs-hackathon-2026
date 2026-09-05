# PeoplePay360 — Contributing & Git Workflow

## 1. Branch Strategy
- Main branch: `main` (production-ready code only)
- Feature branches:
  - `aakif`: Member 3 Backend HR
  - `feature/*`: Specific isolated feature branches

## 2. Commit Message Guidelines
Use structured conventional commits:
- `feat: add employee listing and creation API`
- `feat: implement contract period intelligence and overlap validation`
- `feat: add working schedule expected hours calculation`
- `feat: implement attendance checkin/checkout and exception detection`
- `feat: implement time off balance calculation and approval flow`
- `test: add unit tests for HR domain services`

Avoid vague commits like `update`, `fix`, `wip`.

## 3. Pull Requests
- Keep PRs focused on specific modules.
- Ensure automated tests and TypeScript checks pass before merging.
