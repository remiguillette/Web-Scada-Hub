export const SYSTEM = {
  id: "ENERGY_GRID_SYS_01",
  description: "POWER DISTRIBUTION SCADA",
  node: "GRID-CTRL-01",
  plant: {
    tag: "GEN-PLANT-01",
    name: "Power Plant",
    nominalVoltage: 230,
    nominalFrequency: 50,
    maxPowerKw: 100,
  },
  grid: {
    tag: "STREET-BUS-01",
    name: "Street Distribution Grid",
    voltage: "600Y / 347 V",
    conductors: ["L1", "L2", "L3", "N", "GND"],
  },
  coupler: {
    tag: "CB-COUP-01",
    name: "Coupling Circuit Breaker",
  },
} as const;
