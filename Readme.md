# Web Scada Hub

## Repository purpose

Web Scada Hub is a pnpm workspace monorepo for a SCADA-style web application and supporting libraries. The canonical application in this repository is `artifacts/scada-ui`, a React + Vite frontend that simulates a CAT feeder/dispenser control system with a domain-based power overview, power one-line, and power source views.

`CARDS_AND_BUS_BARS_ARCHITECTURE.md` is intentionally preserved as an architectural backup reference. Its concepts are useful, but several names and paths in that backup document do **not** exactly match the current implementation.

## Current project structure

```text
/workspace/Web-Scada-Hub
├── artifacts/
│   ├── api-server/         # Express API server artifact
│   └── scada-ui/           # Main SCADA frontend application
├── lib/
│   ├── api-client-react/   # Generated API client package
│   ├── api-spec/           # OpenAPI spec and Orval config
│   ├── api-zod/            # Generated Zod types
│   ├── db/                 # Drizzle/Postgres package
│   └── ui/                 # Shared UI component library
├── scripts/                # Workspace utility scripts
├── package.json            # Root scripts
├── pnpm-workspace.yaml     # Workspace definition
├── tsconfig.base.json      # Shared TS configuration
├── tsconfig.json           # Project references
├── Readme.md               # Main consolidated repository documentation
├── AGENT.md                # Agent-oriented repo instructions
└── CARDS_AND_BUS_BARS_ARCHITECTURE.md  # Backup architecture reference (kept on purpose)
```

## Workspace and tooling

- Package manager: `pnpm`
- Language: TypeScript
- Frontend: React + Vite
- Routing: `wouter`
- Shared data/query layer: `@tanstack/react-query`
- API artifact: Express 5
- Shared UI library: `lib/ui`
- Generated API artifacts: `lib/api-client-react`, `lib/api-zod`
- Database package: `lib/db`
- Active workspace globs: `artifacts/*`, `lib/*`, `scripts`
- Removed stale workspace glob: `lib/integrations/*`

### Root scripts

- `pnpm run build` — typechecks then runs package builds where available.
- `pnpm run typecheck` — typechecks workspace libraries, artifacts, and scripts.

## Main application: `artifacts/scada-ui`

`artifacts/scada-ui` is the repository's only frontend application. The main frontend is wired in `artifacts/scada-ui/src/App.tsx`. It wraps the application with these providers before routing:

- `QueryClientProvider`
- `TooltipProvider`
- `LanguageProvider`
- `GridSimulationProvider`
- `GeneratorSimulationProvider`
- `ScadaStateProvider`

### Current routes

- `/` — `PowerOverviewPage` (main SCADA entry point for the power domain)
- `/power/one-line` — full-screen electrical one-line page for the power domain
- `/power/source` — source/generation operations page for the power domain

## SCADA application domains

The frontend currently combines several distinct concerns:

1. **Power overview operations**
   - system status
   - alarms
   - countdown to auto-feed
   - PLC I/O status
   - manual commands and safety controls
   - domain-based navigation entry point

2. **Power one-line visualization**
   - utility supply card
   - supplementary utility service cards
   - ATS card
   - generator bank
   - feeder/street-bus conductor metrics
   - isolated Beaver Woods MT card cluster

3. **Power source contexts**
   - grid simulation values
   - generator live states
   - SCADA process state
   - derived electrical metrics

## Current electrical one-line architecture in code

This section updates the backup architecture to reflect the **current code and paths**.

### Files that define the current implementation

- `artifacts/scada-ui/src/components/electrical-one-line/ElectricalOneLineDiagram.tsx`
- `artifacts/scada-ui/src/components/electrical-one-line/model.ts`
- `artifacts/scada-ui/src/components/electrical-one-line/types.ts`
- `artifacts/scada-ui/src/components/electrical-one-line/constants.ts`
- `artifacts/scada-ui/src/components/electrical-one-line/geometry.ts`
- `artifacts/scada-ui/src/components/electrical-one-line/useConductorMetrics.ts`
- `artifacts/scada-ui/src/config/system.ts`

### What the current model actually contains

The current model builder returns these high-level diagram nodes:

- `utilityNode`
- `supplementaryUtilityNodes`
- `atsNode`
- `generatorUnits`
- `state`

The current state model includes:

- `supplyLive`
- `meterLive`
- `genLive`
- `atsNormal`
- `atsPowered`
- `genBrkLive`
- `mainPanelLive`
- `busLive`

### Important comparison to the backup architecture file

The backup file describes a broader utility path with elements such as:

- riser pole `POLE-0326`
- pad-mounted switchgear `SWGR-3W`
- main bus bar `BUS BAR`
- generator circuit breaker `CB-GEN`

Those names are **not** represented as first-class nodes in the current `buildElectricalModel()` return value.

Instead, the current UI centers on:

- one utility source card (`SYSTEM.utility.tag`, currently `UTILITY`)
- four supplementary utility cards: `UTIL-WTR`, `UTIL-WW`, `UTIL-GAS`, `UTIL-TEL`
- one ATS node: `ATS-001`
- generator units from `SYSTEM.generators`
- a visual utility/street-bus presentation with conductor metrics
- the Beaver Woods MT isolated switchgear-style card group

### Current power-state logic in code

`buildElectricalState()` currently derives the one-line state using voltage, disconnect state, breaker state, and generator activity:

- `supplyLive` is true when `voltage > 0`
- `meterLive` mirrors `supplyLive`
- `atsNormal` mirrors `meterLive`
- `atsPowered` is true when utility or generator power is available
- `mainPanelLive` requires disconnect closed, breaker not tripped, and ATS powered
- `busLive` currently mirrors `mainPanelLive`

This means the present code treats bus energization as a derived state, not as a dedicated bus-bar node object.

## Current card system

### Card families in code

The electrical one-line types define these node kinds:

- `source`
- `equipment`
- `ats`
- `bus` type exists in typings, but the current model does not build and render a standalone bus node from `buildElectricalModel()`

### Current utility and support cards

The current utility model builds:

- a main utility source card using `SYSTEM.utility`
- four supplementary utility equipment cards:
  - Water
  - Wastewater
  - Gas
  - Telecom

### Current ATS card

The ATS node is fixed as `ATS-001` and can report one of these modes:

- `utility`
- `generator`
- `offline`

### Current generator cards

Generator cards are created from `SYSTEM.generators`, which currently contains:

- `GEN-001`
- `GEN-002`
- `GEN-003`

Their displayed status is based on live generator simulation state, with active generator states derived from:

- `READY`
- `LOADED`
- `STABILIZING`
- `STARTING`

## Current conductor and bus-bar visualization

### Conductors

The one-line uses five displayed conductors via `metrics.ts` / `useConductorMetrics.ts`:

- `L1`
- `L2`
- `L3`
- `N`
- `GND`

### Geometry values now used by the UI

The current utility-bus geometry is defined in `artifacts/scada-ui/src/components/electrical-one-line/geometry.ts` and is currently:

- width: `UTILITY_LEFT_CLUSTER_WIDTH + CARD_W + 240`
- height: `500`
- title Y: `100`
- conductor label Y: `108`
- line top: `280`
- line bottom: `560`
- conductor spacing: `25`
- feeder label Y: `216`

This is different from the dimensions recorded in the backup architecture document.

### Card spacing constants now used by the UI

The current constants file defines:

- `CARD_W = 130`
- `SOURCE_COL_W = 142`
- `UTILITY_CARD_GAP = 150`
- `UTILITY_TO_RISER_GAP = 0`
- `UTILITY_SUPPLEMENTARY_CARD_GAP = 26`
- `UTILITY_SUPPLEMENTARY_COUNT = 4`
- `ISOLATED_SWITCHGEAR_CARD_WIDTH = 352`

## Current system configuration

The runtime configuration in `artifacts/scada-ui/src/config/system.ts` currently declares:

- System ID: `CAT_FEEDER_SYS_01`
- Description: `AUTO DISPENSER SCADA`
- PLC: `PLC-001`
- MCC: `MCC-FDR-2`
- Utility tag: `UTILITY`
- Utility provider: `Niagara Peninsula Energy (NPE)`
- Utility nominal voltage: `13800`
- Utility nominal frequency: `60`
- Motor tag: `MTR-001`
- Generator set: `GEN-001`, `GEN-002`, `GEN-003`

## Documentation consolidation result

This repository documentation has been consolidated as follows:

- `Readme.md` — main human-readable repository and architecture guide
- `agent.md` — concise instructions for future coding agents working in this repo
- `CARDS_AND_BUS_BARS_ARCHITECTURE.md` — preserved backup architecture document, intentionally not modified or deleted

## Notes for maintainers

- If the backup architecture file is used to drive future implementation, reconcile it against the current code before adding named nodes like `BUS BAR`, `SWGR-3W`, `POLE-0326`, or `CB-GEN`.
- If the one-line model is expanded later, update `Readme.md` first so the main documentation stays aligned with the real implementation.
