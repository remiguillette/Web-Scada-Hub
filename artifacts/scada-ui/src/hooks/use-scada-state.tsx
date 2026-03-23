import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useGridSimulationContext } from "@/context/GridSimulationContext";
import { deriveScadaState, type Alarm, type AlarmType, type ScadaState } from "@/features/simulation/state";
import { createAlarmPolicy } from "@/features/scada/state/alarmPolicy";
import { useFeedCycleController } from "@/features/scada/state/feedCycleController";
import { useScadaRuntimeTick } from "@/features/scada/state/runtimeTick";
import { buildScadaIoState, buildScadaStateShape } from "@/features/scada/state/stateShape";

export interface ScadaActions {
  /**
   * @deprecated Disconnect state is derived from grid ownership (`gridEnabled`).
   * This action is retained as a compatibility no-op.
   */
  toggleDisconnect: () => void;
  /**
   * @deprecated Disconnect state is derived from grid ownership (`gridEnabled`).
   * This action is retained as a compatibility no-op.
   */
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

  const { pushEvent, setAlarmActive, clearAlarm } = useMemo(
    () => createAlarmPolicy({ setAlarms }),
    [],
  );

  const { triggerFeed } = useFeedCycleController({
    isPowered,
    estopPressed,
    breakerTripped,
    feedActive,
    bowlDetected,
    hopperEmpty,
    bowlDemand,
    isFault,
    systemMode,
    nextFeedingTime,
    pushEvent,
    setAlarmActive,
    setFeedActive,
    setFeedCount,
    setLastFeedTime,
    setNextFeedingTime,
    setHopperLevel,
    setBowlLevel,
  });

  useScadaRuntimeTick({
    feedActive,
    isPowered,
    motorPowered,
    setUptime,
    setVoltage,
    setCurrent,
    setBowlLevel,
    toggleBowlRef,
    setBowlDetected,
  });

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

  const { digitalInputs, digitalOutputs } = useMemo(
    () => buildScadaIoState({
      disconnectClosed,
      breakerTripped,
      hopperHigh,
      hopperLow,
      bowlDetected,
      estopHealthy,
      feederContactor,
      solenoidContactor,
      systemState,
    }),
    [
      bowlDetected,
      breakerTripped,
      disconnectClosed,
      estopHealthy,
      feederContactor,
      hopperHigh,
      hopperLow,
      solenoidContactor,
      systemState,
    ],
  );

  const noopDisconnectAction = () => {};

  return {
    state: buildScadaStateShape({
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
    }),
    actions: {
      toggleDisconnect: noopDisconnectAction,
      setDisconnectClosed: (_closed: boolean) => noopDisconnectAction(),
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
