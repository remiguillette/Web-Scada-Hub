import { Router } from "express";

const router = Router();

interface GridState {
  couplingClosed: boolean;
  powerKw: number;
}

let state: GridState = {
  couplingClosed: false,
  powerKw: 0,
};

const sseClients = new Set<import("express").Response>();

function broadcast(data: GridState) {
  const payload = `data: ${JSON.stringify(computeFullState(data))}\n\n`;
  for (const client of sseClients) {
    client.write(payload);
  }
}

function computeFullState(s: GridState) {
  const energized = s.couplingClosed && s.powerKw > 0;
  const voltage = energized ? 230 + (s.powerKw / 100) * 20 : 0;
  const frequency = energized ? 50 : 0;
  const current = energized ? (s.powerKw * 1000) / (voltage * Math.sqrt(3)) : 0;
  return {
    couplingClosed: s.couplingClosed,
    powerKw: s.powerKw,
    energized,
    voltage: Math.round(voltage * 10) / 10,
    frequency: Math.round(frequency * 100) / 100,
    current: Math.round(current * 100) / 100,
  };
}

router.get("/grid/state", (_req, res) => {
  res.json(computeFullState(state));
});

router.post("/grid/coupling", (req, res) => {
  const { closed } = req.body as { closed: boolean };
  if (typeof closed !== "boolean") {
    res.status(400).json({ error: "closed must be boolean" });
    return;
  }
  state = { ...state, couplingClosed: closed };
  if (!closed) {
    state = { ...state, powerKw: 0 };
  }
  broadcast(state);
  res.json(computeFullState(state));
});

router.post("/grid/power", (req, res) => {
  const { powerKw } = req.body as { powerKw: number };
  if (typeof powerKw !== "number" || powerKw < 0 || powerKw > 100) {
    res.status(400).json({ error: "powerKw must be a number between 0 and 100" });
    return;
  }
  state = { ...state, powerKw };
  broadcast(state);
  res.json(computeFullState(state));
});

router.get("/grid/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  res.write(`data: ${JSON.stringify(computeFullState(state))}\n\n`);

  sseClients.add(res);

  req.on("close", () => {
    sseClients.delete(res);
  });
});

export default router;
