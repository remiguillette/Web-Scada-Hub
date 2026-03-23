import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";

interface UseScadaRuntimeTickParams {
  feedActive: boolean;
  isPowered: boolean;
  motorPowered: boolean;
  setUptime: Dispatch<SetStateAction<number>>;
  setVoltage: Dispatch<SetStateAction<number>>;
  setCurrent: Dispatch<SetStateAction<number>>;
  setBowlLevel: Dispatch<SetStateAction<number>>;
  toggleBowlRef: MutableRefObject<number>;
  setBowlDetected: Dispatch<SetStateAction<boolean>>;
}

export function useScadaRuntimeTick({
  feedActive,
  isPowered,
  motorPowered,
  setUptime,
  setVoltage,
  setCurrent,
  setBowlLevel,
  toggleBowlRef,
  setBowlDetected,
}: UseScadaRuntimeTickParams) {
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
  }, [feedActive, isPowered, motorPowered, setBowlDetected, setBowlLevel, setCurrent, setUptime, setVoltage, toggleBowlRef]);
}
