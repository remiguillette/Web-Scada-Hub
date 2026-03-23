import type { Dispatch, SetStateAction } from "react";
import {
  activateAlarm,
  clearAlarmMessage,
  pushAlarmEvent,
  type Alarm,
  type AlarmType,
} from "@/features/simulation/state";

interface AlarmPolicyParams {
  setAlarms: Dispatch<SetStateAction<Alarm[]>>;
}

export function createAlarmPolicy({ setAlarms }: AlarmPolicyParams) {
  const pushEvent = (message: string, type: AlarmType = "INFO", active = false) => {
    setAlarms((prev) => pushAlarmEvent(prev, message, type, active));
  };

  const setAlarmActive = (message: string, type: AlarmType) => {
    setAlarms((prev) => activateAlarm(prev, message, type));
  };

  const clearAlarm = (message: string, clearMessage?: string) => {
    setAlarms((prev) => clearAlarmMessage(prev, message));

    if (clearMessage) {
      pushEvent(clearMessage, "INFO", false);
    }
  };

  return {
    pushEvent,
    setAlarmActive,
    clearAlarm,
  };
}
