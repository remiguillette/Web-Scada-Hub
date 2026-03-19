export const SYSTEM = {
  id: "CAT_FEEDER_SYS_01",
  description: "AUTO DISPENSER SCADA",
  plc: "PLC-001",
  mcc: "MCC-FDR-2",
  node: "PLC-001 / MCC-FDR-2",
  controllerHealth: "24VDC logic healthy / scan executing",

  utility: {
    tag: "UTILITY",
    name: "Energized Grid",
    provider: "Niagara Peninsula Energy (NPE)",
    nominalVoltage: 120,
    nominalFrequency: 60,
  },

  motor: {
    tag: "MTR-001",
    name: "DISPENSER MTR",
    nominalVoltage: 120,
    nominalFrequency: 60,
    nominalCurrent: 2.2,
    powerFactor: 0.88,
  },

  generators: [
    { tag: "GEN-001", name: "GENERATOR 1", nominalVoltage: 480, nominalFrequency: 60, fuelLevel: 87 },
    { tag: "GEN-002", name: "GENERATOR 2", nominalVoltage: 480, nominalFrequency: 60, fuelLevel: 91 },
    { tag: "GEN-003", name: "GENERATOR 3", nominalVoltage: 480, nominalFrequency: 60, fuelLevel: 84 },
  ],
} as const;
