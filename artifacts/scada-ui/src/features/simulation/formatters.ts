export function formatVoltageDisplay(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} kV`;
  }
  return `${value.toFixed(1)} V`;
}

export function formatSimulationTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}
