import { useState, useEffect, useCallback, useRef } from "react";

export type SystemState = "RUN" | "STANDBY" | "STOP" | "FAULT";

export interface Alarm {
  id: string;
  timestamp: Date;
  message: string;
  active: boolean;
  type: "CRITICAL" | "WARNING" | "INFO";
}

export function useScadaState() {
  // Physical inputs
  const [disconnectClosed, setDisconnectClosed] = useState(false);
  const [breakerTripped, setBreakerTripped] = useState(false);
  const [estopPressed, setEstopPressed] = useState(false);
  
  // Physical states
  const [hopperLevel, setHopperLevel] = useState(100);
  const [bowlDetected, setBowlDetected] = useState(true);
  
  // Logical outputs
  const [feedActive, setFeedActive] = useState(false);
  
  // Stats
  const [feedCount, setFeedCount] = useState(0);
  const [uptime, setUptime] = useState(0);
  const [voltage, setVoltage] = useState(120.0);
  const [current, setCurrent] = useState(0.0);
  
  // Alarms
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  const addAlarm = useCallback((message: string, type: Alarm["type"]) => {
    setAlarms(prev => {
      // Check if already active to prevent spam
      if (prev[0]?.message === message && prev[0]?.active) return prev;
      
      const newAlarm: Alarm = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date(),
        message,
        active: true,
        type
      };
      return [newAlarm, ...prev].slice(0, 5);
    });
  }, []);

  const clearAlarmActive = useCallback((message: string) => {
    setAlarms(prev => prev.map(a => 
      a.message === message ? { ...a, active: false } : a
    ));
  }, []);

  // Derived states
  const isPowered = disconnectClosed && !breakerTripped;
  const isFault = breakerTripped || estopPressed;
  
  let systemState: SystemState = "STOP";
  if (isFault) systemState = "FAULT";
  else if (feedActive) systemState = "RUN";
  else if (isPowered && !estopPressed) systemState = "STANDBY";
  else systemState = "STOP";

  // Simulate hardware behaviors
  useEffect(() => {
    const ticker = setInterval(() => {
      setUptime(prev => prev + 1);
      
      // Voltage fluctuation (118.5 - 121.5)
      setVoltage(120 + (Math.random() * 3 - 1.5));
      
      // Motor current simulation
      if (feedActive) {
        setCurrent(2.4 + Math.random() * 0.8);
      } else {
        setCurrent(0);
      }

      // Random bowl detection toggle (simulating a cat coming/going)
      if (Math.random() < 0.05) { // 5% chance every second
        setBowlDetected(prev => {
          const next = !prev;
          if (!next) addAlarm("BOWL NOT DETECTED", "WARNING");
          else clearAlarmActive("BOWL NOT DETECTED");
          return next;
        });
      }
      
      // Hopper alarms
      if (hopperLevel < 20) {
        addAlarm("HOPPER LOW LEVEL", "WARNING");
      } else {
        clearAlarmActive("HOPPER LOW LEVEL");
      }

    }, 1000);
    return () => clearInterval(ticker);
  }, [feedActive, hopperLevel, addAlarm, clearAlarmActive]);

  // Handle ESTOP logic
  useEffect(() => {
    if (estopPressed) {
      setFeedActive(false);
      addAlarm("ESTOP ACTIVATED", "CRITICAL");
    } else {
      clearAlarmActive("ESTOP ACTIVATED");
    }
  }, [estopPressed, addAlarm, clearAlarmActive]);

  // Handle Breaker logic
  useEffect(() => {
    if (breakerTripped) {
      setFeedActive(false);
      addAlarm("CB-001 TRIPPED", "CRITICAL");
    } else {
      clearAlarmActive("CB-001 TRIPPED");
    }
  }, [breakerTripped, addAlarm, clearAlarmActive]);

  // Handle Feed Cycle
  const feedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const triggerFeed = useCallback(() => {
    if (systemState !== "STANDBY" || !bowlDetected || hopperLevel <= 0) return;
    
    setFeedActive(true);
    
    if (feedTimeoutRef.current) clearTimeout(feedTimeoutRef.current);
    
    feedTimeoutRef.current = setTimeout(() => {
      setFeedActive(false);
      setHopperLevel(prev => Math.max(0, prev - (8 + Math.floor(Math.random() * 4))));
      setFeedCount(prev => prev + 1);
      addAlarm("FEED CYCLE COMPLETE", "INFO");
      setTimeout(() => clearAlarmActive("FEED CYCLE COMPLETE"), 3000);
    }, 3000); // 3 second feed cycle
    
  }, [systemState, bowlDetected, hopperLevel, addAlarm, clearAlarmActive]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (feedTimeoutRef.current) clearTimeout(feedTimeoutRef.current);
    };
  }, []);

  return {
    state: {
      disconnectClosed,
      breakerTripped,
      estopPressed,
      hopperLevel,
      bowlDetected,
      feedActive,
      feedCount,
      uptime,
      voltage,
      current,
      systemState,
      alarms,
      isPowered,
      isFault
    },
    actions: {
      toggleDisconnect: () => setDisconnectClosed(p => !p),
      tripBreaker: () => setBreakerTripped(true),
      resetBreaker: () => setBreakerTripped(false),
      pressEstop: () => setEstopPressed(true),
      resetEstop: () => setEstopPressed(false),
      triggerFeed,
      refillHopper: () => setHopperLevel(100)
    }
  };
}
