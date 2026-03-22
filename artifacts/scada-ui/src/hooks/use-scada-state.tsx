import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useGridSimulationContext } from "@/context/GridSimulationContext";
import {
  activateAlarm,
  buildDigitalInputs,
  buildDigitalOutputs,
  clearAlarmMessage,
  deriveScadaState,
  pushAlarmEvent,
  type Alarm,
  type AlarmType,
  type IoPoint,
  type ScadaState,
} from "@/features/simulation/state";

export interface ScadaActions {
  toggleDisconnect: () => void;
  setDisconnectClosed: (closed: boolean) => void;
  tripBreaker: () => void;
  resetBreaker: () => void;
  setBreakerTripped: (tripped: boolean) => void;
  pressEstop: () => void;
  resetEstop: () => void;
  triggerFeed: () => void;
  refillHopper: () => void;
  clearBowl: () => void;
  restoreBowl: () => void;
  removeBowl: () => void;
}

export interface ScadaStateContextValue {
  state: ScadaState;
  actions: ScadaActions;
}

const ScadaStateContext = createContext<ScadaStateContextValue | null>(null);

function useScadaStateValue(): ScadaStateContextValue {
  const { gridEnabled } = useGridSimulationContext();
  const disconnectClosed = gridEnabled;
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
  const [nextFeedingTime, setNextFeedingTime] = useState(new Date(Date.now() + 70_000));
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  const cycleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toggleBowlRef = useRef(0);

  const {
    isPowered,
    feederContactor,
    solenoidContactor,
    motorPowered,
    gateOpen,
    hopperLow,
    hopperHigh,
    hopperEmpty,
    estopHealthy,
    bowlDemand,
    isFault,
    systemState,
    systemMode,
  } = deriveScadaState({
    disconnectClosed,
    breakerTripped,
    estopPressed,
    hopperLevel,
    bowlLevel,
    bowlDetected,
    feedActive,
  });

  const pushEvent = useCallback((message: string, type: AlarmType = "INFO", active = false) => {
    setAlarms((prev) => pushAlarmEvent(prev, message, type, active));
  }, []);

  const setAlarmActive = useCallback((message: string, type: AlarmType) => {
    setAlarms((prev) => activateAlarm(prev, message, type));
  }, []);

  const clearAlarm = useCallback((message: string, clearMessage?: string) => {
    setAlarms((prev) => clearAlarmMessage(prev, message));

    if (clearMessage) {
      pushEvent(clearMessage, "INFO", false);
    }
  }, [pushEvent]);

  const finishFeedCycle = useCallback(() => {
    setFeedActive(false);
    setFeedCount((prev) => prev + 1);
    setLastFeedTime(new Date());
    setNextFeedingTime(new Date(Date.now() + 70_000));
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
    cycleTimeoutRef.current = setTimeout(finishFeedCycle, 4200);
  }, [breakerTripped, bowlDetected, estopPressed, feedActive, finishFeedCycle, hopperEmpty, isPowered, pushEvent, setAlarmActive]);

  useEffect(() => {
    const timer = setInterval(() => {
      setUptime((prev) => prev + 1);
      setVoltage(isPowered ? Number((13_800 + (Math.random() - 0.5) * 140).toFixed(1)) : 0);
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
    if (gridEnabled) {
      setBreakerTripped(false);
    }
  }, [gridEnabled]);

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

  const digitalInputs: IoPoint[] = useMemo(
    () => buildDigitalInputs({ disconnectClosed, breakerTripped, hopperHigh, hopperLow, bowlDetected, estopHealthy }),
    [bowlDetected, breakerTripped, disconnectClosed, estopHealthy, hopperHigh, hopperLow],
  );

  const digitalOutputs: IoPoint[] = useMemo(
    () => buildDigitalOutputs({ feederContactor, solenoidContactor, systemState }),
    [feederContactor, solenoidContactor, systemState],
  );

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
      estopHealthy,
      bowlDemand,
      digitalInputs,
      digitalOutputs,
    },
    actions: {
      toggleDisconnect: () => {},
      setDisconnectClosed: (_closed: boolean) => {},
      tripBreaker: () => setBreakerTripped(true),
      resetBreaker: () => setBreakerTripped(false),
      setBreakerTripped,
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

export function ScadaStateProvider({ children }: { children: ReactNode }) {
  const value = useScadaStateValue();
  return <ScadaStateContext.Provider value={value}>{children}</ScadaStateContext.Provider>;
}

export function useScadaState() {
  const ctx = useContext(ScadaStateContext);
  if (!ctx) {
    throw new Error("useScadaState must be used inside ScadaStateProvider");
  }
  return ctx;
}

export type { Alarm, AlarmType, IoPoint, ScadaState, SystemMode, SystemState } from "@/features/simulation/state";
