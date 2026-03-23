import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { AlarmType } from "@/features/simulation/state";

interface UseFeedCycleControllerParams {
  isPowered: boolean;
  estopPressed: boolean;
  breakerTripped: boolean;
  feedActive: boolean;
  bowlDetected: boolean;
  hopperEmpty: boolean;
  bowlDemand: boolean;
  isFault: boolean;
  systemMode: "AUTO" | "MANUAL" | "LOCKOUT";
  nextFeedingTime: Date;
  pushEvent: (message: string, type?: AlarmType, active?: boolean) => void;
  setAlarmActive: (message: string, type: AlarmType) => void;
  setFeedActive: Dispatch<SetStateAction<boolean>>;
  setFeedCount: Dispatch<SetStateAction<number>>;
  setLastFeedTime: Dispatch<SetStateAction<Date | null>>;
  setNextFeedingTime: Dispatch<SetStateAction<Date>>;
  setHopperLevel: Dispatch<SetStateAction<number>>;
  setBowlLevel: Dispatch<SetStateAction<number>>;
}

export function useFeedCycleController({
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
}: UseFeedCycleControllerParams) {
  const cycleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finishFeedCycle = useCallback(() => {
    setFeedActive(false);
    setFeedCount((prev) => prev + 1);
    setLastFeedTime(new Date());
    setNextFeedingTime(new Date(Date.now() + 70_000));
    setHopperLevel((prev) => Math.max(0, Number((prev - (6 + Math.random() * 3)).toFixed(1))));
    setBowlLevel((prev) => Math.min(100, Number((prev + 22 + Math.random() * 8).toFixed(1))));
    pushEvent("FEED CYCLE COMPLETED", "INFO", false);
  }, [pushEvent, setBowlLevel, setFeedActive, setFeedCount, setHopperLevel, setLastFeedTime, setNextFeedingTime]);

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
  }, [
    breakerTripped,
    bowlDetected,
    estopPressed,
    feedActive,
    finishFeedCycle,
    hopperEmpty,
    isPowered,
    pushEvent,
    setAlarmActive,
    setFeedActive,
  ]);

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

  return {
    triggerFeed,
  };
}
