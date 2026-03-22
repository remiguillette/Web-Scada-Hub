import type { Alarm, AlarmType } from "./types";
import { createAlarm } from "./derived";

export function pushAlarmEvent(
  prev: Alarm[],
  message: string,
  type: AlarmType = "INFO",
  active = false,
): Alarm[] {
  const duplicate = prev.find((alarm) => alarm.message === message && alarm.active === active);
  if (duplicate) {
    return prev;
  }

  return [createAlarm(message, type, active), ...prev].slice(0, 14);
}

export function activateAlarm(prev: Alarm[], message: string, type: AlarmType): Alarm[] {
  const existingIndex = prev.findIndex((alarm) => alarm.message === message);

  if (existingIndex >= 0) {
    const existing = prev[existingIndex];
    if (existing.active) {
      return prev;
    }

    const updated = [...prev];
    updated[existingIndex] = {
      ...existing,
      active: true,
      type,
      timestamp: new Date(),
    };
    return updated;
  }

  return [createAlarm(message, type, true), ...prev].slice(0, 14);
}

export function clearAlarmMessage(prev: Alarm[], message: string): Alarm[] {
  return prev.map((alarm) =>
    alarm.message === message && alarm.active
      ? { ...alarm, active: false, timestamp: new Date() }
      : alarm,
  );
}
