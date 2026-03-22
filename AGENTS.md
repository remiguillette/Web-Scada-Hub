# agent.md

## Repository guidance

- Use `pnpm`, not npm or yarn.
- Treat `artifacts/scada-ui` as the primary frontend application.
- Keep `CARDS_AND_BUS_BARS_ARCHITECTURE.md` as a backup reference document unless a user explicitly asks to edit it.
- Prefer updating `Readme.md` when repository structure or architecture changes.

## High-value paths

- `artifacts/scada-ui/src/App.tsx` — top-level providers and routes
- `artifacts/scada-ui/src/pages/` — page entry points
- `artifacts/scada-ui/src/components/electrical-one-line/` — one-line architecture and rendering
- `artifacts/scada-ui/src/config/system.ts` — main system identifiers and nominal values
- `lib/ui/` — shared UI package
- `artifacts/api-server/` — API artifact

## Documentation policy

- Main repo documentation lives in `Readme.md`.
- Keep documentation aligned with the current code, not with outdated mockups.
- Before documenting the one-line architecture, compare `Readme.md` against:
  - `artifacts/scada-ui/src/components/electrical-one-line/model.ts`
  - `artifacts/scada-ui/src/components/electrical-one-line/types.ts`
  - `artifacts/scada-ui/src/components/electrical-one-line/geometry.ts`
  - `artifacts/scada-ui/src/config/system.ts`

## Verification

- Run `pnpm run typecheck` after non-trivial code changes.
- For documentation-only changes, at minimum verify the changed markdown files and check `git diff`.

# Repository Agent Notes

## Working agreements
- Use `rg`/`find` for discovery instead of recursive `ls`/`grep` in this repository.
- Keep the workspace free of Replit-only metadata and dependencies unless a current deployment explicitly requires them.

## 2026-03-22 update
- Audited `.replit`, `artifacts/*/.replit-artifact/`, Vite configs, and package manifests for active deployment dependencies.
- Removed Replit-only tracked files and Vite plugins after confirming the workspace no longer references them outside the deleted metadata/config.
- `artifacts/scada-ui-new/` is currently empty, so there was no `src/App.tsx` file there to update; the active SCADA application lives under `artifacts/scada-ui/`.
