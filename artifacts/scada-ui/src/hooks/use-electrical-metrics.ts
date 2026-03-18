import { useEffect, useRef, useState } from "react";
import { SYSTEM } from "@/config/system";

export interface ElectricalMetrics {
  powerFactor: number;
  apparentPower: number;
  activePower: number;
  reactivePower: number;
  powerFactorAngle: number;
}

const PF_NOMINAL = SYSTEM.motor.powerFactor;
const PF_MAX_DELTA = 0.008;
const PF_MIN = 0.80;
const PF_MAX = 0.96;

export function useElectricalMetrics(
  voltage: number,
  current: number,
  motorPowered: boolean,
): ElectricalMetrics {
  const [powerFactor, setPowerFactor] = useState(motorPowered ? PF_NOMINAL : 1.0);
  const directionRef = useRef(1);

  useEffect(() => {
    if (!motorPowered) {
      setPowerFactor(1.0);
      return;
    }

    setPowerFactor(PF_NOMINAL);

    const id = window.setInterval(() => {
      setPowerFactor((prev) => {
        const delta = (Math.random() * PF_MAX_DELTA) * directionRef.current;
        const next = prev + delta;
        if (next >= PF_MAX) { directionRef.current = -1; return PF_MAX; }
        if (next <= PF_MIN) { directionRef.current = 1; return PF_MIN; }
        return Number(next.toFixed(4));
      });
    }, 1500);

    return () => window.clearInterval(id);
  }, [motorPowered]);

  const apparentPower = Number((voltage * current).toFixed(1));
  const activePower = Number((apparentPower * powerFactor).toFixed(1));
  const reactivePower = Number(Math.sqrt(Math.max(0, apparentPower ** 2 - activePower ** 2)).toFixed(1));
  const powerFactorAngle = Number((Math.acos(powerFactor) * (180 / Math.PI)).toFixed(1));

  return { powerFactor, apparentPower, activePower, reactivePower, powerFactorAngle };
}
