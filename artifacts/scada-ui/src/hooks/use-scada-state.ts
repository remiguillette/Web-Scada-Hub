import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type SystemState = "RUN" | "STANDBY" | "STOP" | "FAULT";
export type AlarmType = "CRITICAL" | "WARNING" | "INFO";
export type SystemMode = "AUTO" | "MANUAL" | "LOCKOUT";

export interface Alarm {
  id: string;
  timestamp: Date;
  message: string;
  active: boolean;
  type: AlarmType;
}

export interface IoPoint {
  id: string;
  label: string;
  on: boolean;
}

const FEED_DURATION_MS = 4200;
const AUTO_FEED_INTERVAL_MS = 70_000;

const makeId = () => Math.random().toString(36).slice(2, 10);

export function useScadaState() {
  const [disconnectClosed, setDisconnectClosed] = useState(false);
  const [breakerTripped, setBreakerTripped] = useState(false);
  const [estopPressed, setEstopPressed] = useState(false);
  const [hopperLevel, setHopperLevel] = useState(78);
  const [bowlLevel, setBowlLevel] = useState(24);
  const [bowlDetected, setBowlDetected] = useState(true);
  const [feedActive, setFeedActive] = useState(false);
  const [feedCount, setFeedCount] = useState(0);
  const [uptime, setUptime] = useState(0);
  const [voltage, setVoltage] = useState(0);
  const [current, setCurrent] = useState(0);
  const [lastFeedTime, setLastFeedTime] = useState<Date | null>(null);
  const [nextFeedingTime, setNextFeedingTime] = useState(new Date(Date.now() + AUTO_FEED_INTERVAL_MS));
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  const cycleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toggleBowlRef = useRef(0);

  const isPowered = disconnectClosed && !breakerTripped;
  const feederContactor = isPowered && !estopPressed && feedActive;
  const solenoidContactor = isPowered && !estopPressed && feedActive;
  const motorPowered = feederContactor;
  const gateOpen = solenoidContactor;
  const hopperLow = hopperLevel <= 25;
  const hopperHigh = hopperLevel >= 55;
  const hopperEmpty = hopperLevel <= 0;
  const estopHealthy = !estopPressed;
  const bowlDemand = bowlLevel <= 35;
  const isFault = breakerTripped || estopPressed || hopperEmpty;

  const systemState: SystemState = isFault
    ? "FAULT"
    : feedActive
      ? "RUN"
      : isPowered
        ? "STANDBY"
        : "STOP";

  const systemMode: SystemMode = isFault ? "LOCKOUT" : disconnectClosed ? "AUTO" : "MANUAL";

  const pushEvent = useCallback((message: string, type: AlarmType = "INFO", active = false) => {
    setAlarms((prev) => {
      const duplicate = prev.find((alarm) => alarm.message === message && alarm.active === active);
      if (duplicate) {
        return prev;
      }

      return [
        {
          id: makeId(),
          timestamp: new Date(),
          message,
          active,
          type,
        },
        ...prev,
      ].slice(0, 14);
    });
  }, []);

  const setAlarmActive = useCallback((message: string, type: AlarmType) => {
    setAlarms((prev) => {
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

      return [
        {
          id: makeId(),
          timestamp: new Date(),
          message,
          active: true,
          type,
        },
        ...prev,
      ].slice(0, 14);
    });
  }, []);

  const clearAlarm = useCallback((message: string, clearMessage?: string) => {
    setAlarms((prev) => {
      const next = prev.map((alarm) =>
        alarm.message === message && alarm.active ? { ...alarm, active: false, timestamp: new Date() } : alarm,
      );
      return next;
    });

    if (clearMessage) {
      pushEvent(clearMessage, "INFO", false);
    }
  }, [pushEvent]);

  const finishFeedCycle = useCallback(() => {
    setFeedActive(false);
    setFeedCount((prev) => prev + 1);
    setLastFeedTime(new Date());
    setNextFeedingTime(new Date(Date.now() + AUTO_FEED_INTERVAL_MS));
    setHopperLevel((prev) => Math.max(0, Number((prev - (6 + Math.random() * 3)).toFixed(1))));
    setBowlLevel((prev) => Math.min(100, Number((prev + 22 + Math.random() * 8).toFixed(1))));
    pushEvent("FEED CYCLE COMPLETED", "INFO", false);
  }, [pushEvent]);

  const triggerFeed = useCallback(() => {
    if (!isPowered || estopPressed || breakerTripped || feedActive) return;
    if (!bowlDetected) {
      setAlarmActive("BOWL NOT DETECTED", "WARNING");
      return;
    }
    if (hopperEmpty) {
      setAlarmActive("HOPPER EMPTY", "CRITICAL");
      return;
    }

    setFeedActive(true);
    pushEvent("FEED CYCLE STARTED", "INFO", false);

    if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
    cycleTimeoutRef.current = setTimeout(finishFeedCycle, FEED_DURATION_MS);
  }, [breakerTripped, bowlDetected, estopPressed, feedActive, finishFeedCycle, hopperEmpty, isPowered, pushEvent, setAlarmActive]);

  useEffect(() => {
    const timer = setInterval(() => {
      setUptime((prev) => prev + 1);
      setVoltage(isPowered ? Number((119.6 + (Math.random() - 0.5) * 1.4).toFixed(1)) : 0);
      setCurrent(motorPowered ? Number((1.85 + Math.random() * 0.75).toFixed(2)) : 0);
      setBowlLevel((prev) => Math.max(0, Number((prev - 0.045).toFixed(1))));
      toggleBowlRef.current += 1;

      if (toggleBowlRef.current % 45 === 0 && !feedActive) {
        const present = Math.random() > 0.15;
        setBowlDetected(present);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [feedActive, isPowered, motorPowered]);

  useEffect(() => {
    if (!disconnectClosed) {
      setFeedActive(false);
      pushEvent("MAIN DISCONNECT OPENED", "WARNING", false);
    } else {
      pushEvent("MAIN DISCONNECT CLOSED", "INFO", false);
    }
  }, [disconnectClosed, pushEvent]);

  useEffect(() => {
    if (breakerTripped) {
      setFeedActive(false);
      setAlarmActive("CB-001 TRIPPED", "CRITICAL");
      pushEvent("BREAKER TRIPPED - DOWNSTREAM POWER LOST", "CRITICAL", true);
    } else {
      clearAlarm("CB-001 TRIPPED", "BREAKER RESET");
    }
  }, [breakerTripped, clearAlarm, pushEvent, setAlarmActive]);

  useEffect(() => {
    if (estopPressed) {
      setFeedActive(false);
      setAlarmActive("EMERGENCY STOP ACTIVE", "CRITICAL");
      pushEvent("EMERGENCY STOP ACTIVE", "CRITICAL", true);
    } else {
      clearAlarm("EMERGENCY STOP ACTIVE", "FAULT RESET");
    }
  }, [clearAlarm, estopPressed, pushEvent, setAlarmActive]);

  useEffect(() => {
    if (hopperLow) {
      setAlarmActive(hopperEmpty ? "HOPPER EMPTY" : "HOPPER LOW LEVEL", hopperEmpty ? "CRITICAL" : "WARNING");
    } else {
      clearAlarm("HOPPER LOW LEVEL");
      clearAlarm("HOPPER EMPTY");
    }
  }, [clearAlarm, hopperEmpty, hopperLow, setAlarmActive]);

  useEffect(() => {
    if (!bowlDetected) {
      setAlarmActive("BOWL NOT DETECTED", "WARNING");
    } else {
      clearAlarm("BOWL NOT DETECTED");
    }
  }, [bowlDetected, clearAlarm, setAlarmActive]);

  useEffect(() => {
    if (systemMode === "AUTO" && bowlDemand && isPowered && !feedActive && !isFault && bowlDetected) {
      const msUntilFeed = nextFeedingTime.getTime() - Date.now();
      if (msUntilFeed <= 0) {
        triggerFeed();
      }
    }
  }, [bowlDemand, bowlDetected, feedActive, isFault, isPowered, nextFeedingTime, systemMode, triggerFeed]);

  useEffect(() => () => {
    if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
  }, []);

  const digitalInputs: IoPoint[] = useMemo(() => [
    { id: "DI-01", label: "MDS-001 ON", on: disconnectClosed },
    { id: "DI-02", label: "CB-001 OK", on: !breakerTripped },
    { id: "DI-03", label: "HOPPER HIGH", on: hopperHigh },
    { id: "DI-04", label: "HOPPER LOW", on: hopperLow },
    { id: "DI-05", label: "BOWL DETECT", on: bowlDetected },
    { id: "DI-06", label: "ESTOP NC", on: estopHealthy },
  ], [bowlDetected, breakerTripped, disconnectClosed, estopHealthy, hopperHigh, hopperLow]);

  const digitalOutputs: IoPoint[] = useMemo(() => [
    { id: "DO-01", label: "FEEDER CTR", on: feederContactor },
    { id: "DO-02", label: "HOPPER SOL", on: solenoidContactor },
    { id: "DO-03", label: "BEACON GRN", on: systemState === "RUN" || systemState === "STANDBY" },
    { id: "DO-04", label: "BEACON RED", on: systemState === "FAULT" },
  ], [feederContactor, solenoidContactor, systemState]);

  return {
    state: {
      disconnectClosed,
      breakerTripped,
      estopPressed,
      hopperLevel,
      bowlLevel,
      bowlDetected,
      feedActive,
      feederContactor,
      solenoidContactor,
      motorPowered,
      gateOpen,
      hopperLow,
      hopperHigh,
      hopperEmpty,
      feedCount,
      uptime,
      voltage,
      current,
      lastFeedTime,
      nextFeedingTime,
      systemState,
      systemMode,
      alarms,
      isPowered,
      isFault,
      digitalInputs,
      digitalOutputs,
    },
    actions: {
      toggleDisconnect: () => setDisconnectClosed((prev) => !prev),
      tripBreaker: () => setBreakerTripped(true),
      resetBreaker: () => setBreakerTripped(false),
      pressEstop: () => setEstopPressed(true),
      resetEstop: () => setEstopPressed(false),
      triggerFeed,
      refillHopper: () => {
        setHopperLevel(100);
        clearAlarm("HOPPER LOW LEVEL", "HOPPER REFILLED");
        clearAlarm("HOPPER EMPTY", "HOPPER REFILLED");
      },
      clearBowl: () => setBowlLevel(0),
      restoreBowl: () => setBowlDetected(true),
      removeBowl: () => setBowlDetected(false),
    },
  };
}
