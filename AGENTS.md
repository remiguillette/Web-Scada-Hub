# Repository Agent Notes

## Working agreements
- Use `rg`/`find` for discovery instead of recursive `ls`/`grep` in this repository.
- Keep the workspace free of Replit-only metadata and dependencies unless a current deployment explicitly requires them.

## 2026-03-22 update
- Audited `.replit`, `artifacts/*/.replit-artifact/`, Vite configs, and package manifests for active deployment dependencies.
- Removed Replit-only tracked files and Vite plugins after confirming the workspace no longer references them outside the deleted metadata/config.
- `artifacts/scada-ui-new/` is currently empty, so there was no `src/App.tsx` file there to update; the active SCADA application lives under `artifacts/scada-ui/`.
