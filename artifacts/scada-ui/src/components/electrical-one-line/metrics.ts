export const CONDUCTORS = [
  { label: "L1", color: "#5a82b5", glow: "rgba(90,130,181,0.18)" },
  { label: "L2", color: "#c96a6a", glow: "rgba(201,106,106,0.16)" },
  { label: "L3", color: "#c48e3b", glow: "rgba(196,142,59,0.16)" },
  { label: "N", color: "#8f8f8f", glow: "rgba(143,143,143,0.1)" },
  { label: "GND", color: "#5b8f6b", glow: "rgba(91,143,107,0.16)" },
] as const;

export type StreetBusMetric = {
  label: string;
  lines: [string, string, string];
  color: string;
  glow: string;
};

export function formatBusVoltage(value: number) {
  return `${Math.round(value)} V`;
}

export function formatBusCurrent(value: number) {
  return `${Math.max(0, Math.round(value))} A`;
}
