# Cards and Bus Bars Architecture

## Overview

The SCADA system uses a modular card-based architecture to represent electrical equipment and components. These cards are connected through bus bars and conductors to visualize the complete electrical distribution system.

---

## Card System

### What Are Cards?

Cards are the fundamental UI components that represent electrical equipment and devices. Each card displays:
- **Tag**: Unique identifier (e.g., `CB-UTIL`, `CB-GEN`)
- **Title**: Equipment description (e.g., "Breaker/Recloser", "Circuit Breaker")
- **Status**: Current operational state (e.g., "Closed", "Open", "Monitoring")
- **Visual Indicator**: Active/inactive state with color coding
- **Icon**: Visual representation of the device type
- **Expandable Details**: Optional configuration and metrics (for certain cards)

### Card Types

There are three primary card types:

#### 1. **Source Cards** (`kind: "source"`)
Represent power generation sources:
- Generator units (GEN-001, GEN-002, GEN-003)
- Utility service entrance (UTILITY)
- Display fuel levels and status information

#### 2. **Equipment Cards** (`kind: "equipment"`)
Represent protective and control devices:
- Circuit Breakers/Reclosers (CB-UTIL, CB-GEN)
- Pad-Mounted Switchgear (SWGR-3W)
- Transformers
- Meters and Main Panels
- SCADA Monitor (SCADA-01)

#### 3. **ATS Cards** (`kind: "ats"`)
Automatic Transfer Switches that manage power source selection:
- Modes: utility, generator, or offline
- Provide the switching logic for backup power

### Card Visual Styling

Cards use **accent colors** to indicate equipment type and status:

| Accent | Color | Use Case |
|--------|-------|----------|
| **green** | `#8bd6b6` | Active/Normal operation |
| **cyan** | `#5bc2db` | Protection equipment, switchgear |
| **red** | `#d55e68` | Fault/Error state |
| **amber** | `#d89a5a` | Warning/Standby state |
| **violet** | `#9b87c4` | Monitoring/Control systems |

---

## Bus Bar Configuration

### Main Bus Bar

**Tag**: `BUS BAR`

The main bus bar is the central distribution point that:
- Receives power from either the utility service or generators
- Distributes power to feeder circuits
- Acts as the control point for system synchronization

**Bus Bar Voltage**: 13,800V (utility-side), stepped down to 600V at secondary locations

### Conductor Configuration

The system uses **5 conductors** for power distribution:

```javascript
CONDUCTORS = [
  { label: "L1", color: "#5a82b5", glow: "rgba(90,130,181,0.18)" },   // Blue
  { label: "L2", color: "#c96a6a", glow: "rgba(201,106,106,0.16)" },   // Red
  { label: "L3", color: "#c48e3b", glow: "rgba(196,142,59,0.16)" },    // Orange
  { label: "N",  color: "#8f8f8f", glow: "rgba(143,143,143,0.1)" },    // Gray (Neutral)
  { label: "GND",color: "#5b8f6b", glow: "rgba(91,143,107,0.16)" },    // Green (Ground)
]
```

#### Conductor Specifications:
- **L1, L2, L3**: Three-phase power lines (120° phase separation)
- **N (Neutral)**: Return path for unbalanced loads
- **GND (Ground)**: Safety ground reference

---

## System Architecture Flow

### Power Path: Top Level

```
┌─────────────────────────────────────────┐
│         UTILITY SERVICE ENTRANCE        │
│              (UTILITY)                  │
│          13,800V / 60Hz 3Φ              │
└─────────────┬───────────────────────────┘
              │
              ├──► Breaker/Recloser (CB-UTIL)
              │    └──► Isolation & fault detection
              │
              ├──► Pad-Mounted Switchgear (SWGR-3W)
              │    └──► 3-way loop feed distribution
              │
              └──► Main Bus Bar (BUS BAR)
                   │
                   ├──► SCADA Monitor (SCADA-01)
                   │    └──► Real-time system monitoring
                   │
                   ├──► Feeder A (Residential Circuit)
                   │    ├──► Underground Feeder (UG-FDR-A)
                   │    ├──► Loop-Feed Transformer (XFMR-RES)
                   │    └──► Residential Load
                   │
                   └──► Feeder B (Commercial Circuit)
                        ├──► Underground Feeder (UG-FDR-B)
                        ├──► Loop-Feed Transformer (XFMR-COM)
                        └──► Commercial Load
```

### Backup Power Path

```
┌──────────────────────┐
│   Generator Units    │
│  (GEN-001/002/003)  │
│    13,800V / 60Hz   │
└──────────┬───────────┘
           │
           └──► Generator Circuit Breaker (CB-GEN)
                └──► ATS Switch Logic
                     └──► Main Bus Bar
```

---

## Card Connection Details

### Utility-to-Bus Connection

**Cards in sequence:**
1. Utility Service (`UTILITY`)
2. Supplementary Utility Cards (configuration monitoring)
3. Breaker/Recloser (`CB-UTIL`)
4. Riser Pole & Switchgear (`POLE-0326`, `SWGR-3W`)
5. **Main Bus Bar** (`BUS BAR`)

**Connection Method**: SVG conductor paths with animated flow when active
- Spacing: 150px between major cards
- Spread: 8px vertical separation for conductor visualization
- Breakout pattern: Conductors fan out then converge at connection points

### Feeder Loop Connections

Each feeder is a **duplex loop** that provides redundancy:

#### Feeder A (Residential)
- **Tag**: `UG-FDR-A`
- **Transformer**: `XFMR-RES` (Loop-Feed Transformer)
- **Status**: "Underground Loop Feed" when active
- **Load**: Residential services
- **Path**: BUS BAR → Feeder → Transformer → Load

#### Feeder B (Commercial)
- **Tag**: `UG-FDR-B`
- **Transformer**: `XFMR-COM` (Loop-Feed Transformer)
- **Status**: "Underground Loop Feed" when active
- **Load**: Commercial services
- **Path**: BUS BAR → Feeder → Transformer → Load

**Loop Configuration Benefits:**
- Redundancy: Power flows from both directions
- Automatic switchover on fault
- Independent operation possible
- Load balancing capability

---

## Visual Indicators

### Power Flow Animation

When a card or conductor is **active** (powered):
- Color brightens to full intensity
- Animated dash pattern flows along conductors
- Animation delay: Staggered by 0.1-0.12 seconds per phase
- Glow effect applied to active elements

### Inactive State
- Colors fade to gray (#7a7a7a)
- Dashed animation stops
- Low opacity (0.16-0.4)

### Status Dot Indicators
- **Green dot**: Normal/Active
- **Red dot**: Fault/Error
- **Amber dot**: Warning/Standby
- **Gray dot**: Offline/Disconnected

---

## Bus Geometry & Layout

### Utility Bus Dimensions
```
Width:      486px
Height:     260px
Line Top:   70px
Line Bottom: 260px
```

### Card Spacing
```
CARD_WIDTH:                    130px
UTILITY_CARD_GAP:              150px
UTILITY_SUPPLEMENTARY_GAP:     26px
UTILITY_TO_RISER_GAP:          0px
UTILITY_SUPPLEMENTARY_COUNT:   4 cards
```

### Conductor Horizontal Spacing
```
Spacing between L1/L2/L3/N/GND: Calculated based on bus width
Vertical offset in breakout:    8px between each phase
```

---

## Data Flow

### System State Management

The electrical diagram responds to state changes:

```typescript
// State affects power flow
state = {
  supplyLive: boolean,      // Utility supply active?
  busLive: boolean,         // Main bus bar powered?
  genBrkLive: boolean,      // Generator breaker closed?
  feederContactor: boolean, // Feeder contactor engaged?
  // ... other device states
}
```

### Card Properties

Each card is configured with:
```typescript
{
  tag: string,              // Unique identifier
  title: string,            // Display name
  status: string,           // Current operational status
  active: boolean,          // Is powered?
  accent: Accent,           // Color scheme
  icon?: ReactNode,         // Optional SVG icon
  details?: DetailRow[],    // Optional expanded info
  miniStatuses?: Status[],  // Sub-component status
  onClick?: () => void,     // Interaction handler
}
```

---

## Configuration Reference

### System Configuration File
**Location**: `src/config/system.ts`

```typescript
System ID:     CAT_FEEDER_SYS_01
PLC:           PLC-001
MCC:           MCC-FDR-2
Utility:       Niagara Peninsula Energy (NPE)
Nominal Voltage (Utility): 13,800V
Nominal Frequency: 60Hz

Generators:    3 units (GEN-001, GEN-002, GEN-003)
Motor:         MTR-001 (600V, 2.2A, 0.88 PF)
```

---

## Summary Table

| Component | Tag | Type | Voltage | Status Display |
|-----------|-----|------|---------|-----------------|
| Utility Service | UTILITY | Source | 13.8kV | Connected/Disconnected |
| Breaker/Recloser | CB-UTIL | Equipment | 13.8kV | Closed/Open/Tripped |
| Switchgear | SWGR-3W | Equipment | 13.8kV | 3-Way Loop Feed |
| **Main Bus Bar** | BUS BAR | Bus | 13.8kV | Live/Dead |
| Feeder A (Residential) | UG-FDR-A | Feeder | 13.8kV | Loop Feed/Standby |
| Feeder B (Commercial) | UG-FDR-B | Feeder | 13.8kV | Loop Feed/Standby |
| Generators | GEN-001/002/003 | Source | 13.8kV | Running/Standby/Off |
| Generator Breaker | CB-GEN | Equipment | 13.8kV | Closed/Open |
| SCADA Monitor | SCADA-01 | Equipment | 13.8kV | Monitoring/Offline |

---

## Visual Layout Reference

```
┌─────────────────────────────────────────────────────────────────┐
│                     UTILITY STREET BUS (13.8kV)                  │
│                      [LA] [CB] [SWGR]                            │
├─────────────────────────────────────────────────────────────────┤
│                        MAIN BUS BAR (BUS)                        │
│         |                    |                    |              │
│      [SCADA-01]           [FEEDER A]           [FEEDER B]        │
│    (Monitoring)        (Residential Loop)   (Commercial Loop)    │
│                           |                      |               │
│                    ┌──────┴────────┐     ┌────────┴──────┐       │
│                    │                │     │               │       │
│              [XFMR-RES]        [XFMR-COM]                │       │
│                    │                │     │               │       │
│            ┌───────┴────────┐ ┌────┴─────┴──────┐         │       │
│            │                │ │                 │         │       │
│       [Residential]    [Commercial]                         │       │
│         Load A           Load B                            │       │
│                                                             │       │
│  BACKUP POWER:                                             │       │
│  [GEN-001] [GEN-002] [GEN-003] ──► [CB-GEN] ──► BUS        │       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Files Reference

- **Main Diagram Component**: [artifacts/scada-ui/src/components/ElectricalOneLine.tsx](artifacts/scada-ui/src/components/ElectricalOneLine.tsx)
- **System Configuration**: [artifacts/scada-ui/src/config/system.ts](artifacts/scada-ui/src/config/system.ts)
- **Translations/Labels**: [artifacts/scada-ui/src/i18n/translations.ts](artifacts/scada-ui/src/i18n/translations.ts)
- **Component Container**: [artifacts/scada-ui/src/App.tsx](artifacts/scada-ui/src/App.tsx)
