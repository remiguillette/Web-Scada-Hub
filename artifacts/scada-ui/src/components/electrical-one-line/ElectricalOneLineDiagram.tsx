import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Building2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import niagaraFallsBackground from '@/assets/Niagarafallspng1500.png';
import { SYSTEM } from '@/config/system';
import { useTranslation } from '@/context/LanguageContext';
import { BeaverWoodsMtCard } from './BeaverWoodsMtCard';
import {
  BASE_DIAGRAM_SCALE,
  BUTTON_ZOOM_STEP,
  CARD_W,
  KEYBOARD_ZOOM_STEP,
  MAX_ZOOM,
  MIN_ZOOM,
  PAN_STEP,
  SOURCE_COL_W,
  UTILITY_CARD_GAP,
  UTILITY_SUPPLEMENTARY_CARD_GAP,
  UTILITY_TO_RISER_GAP,
} from './constants';
import { GeneratorBank } from './GeneratorBank';
import { clamp, clampOffset, getUsefulBoundsForWorldObjects, getUtilityBusLayout, UTILITY_BUS_GEOMETRY } from './geometry';
import { buildElectricalModel } from './model';
import { buildElectricalOneLineWorldObjects, getElectricalOneLineGeneratorPathLayout } from './world-model';
import { NodeCard } from './NodeCard';
import { StatusIcon } from './StatusIcon';
import type { ATSNode, DragState, ElectricalOneLineProps, PinchState } from './types';
import { UtilityBusAnnotations } from './UtilityBusAnnotations';
import { UtilityBusBackground } from './UtilityBusBackground';
import { UtilityCardInterconnect } from './UtilityCardInterconnect';
import { useConductorMetrics } from './useConductorMetrics';

const ZOOM_STEP = 0.0015;
const ELECTRICAL_ONE_LINE_WORLD_OBJECTS = buildElectricalOneLineWorldObjects();
const { generatorBranchVerticalOffset: WORLD_GENERATOR_BRANCH_VERTICAL_OFFSET, generatorBranchWireWidth: WORLD_GENERATOR_BRANCH_WIRE_WIDTH } = getElectricalOneLineGeneratorPathLayout(ELECTRICAL_ONE_LINE_WORLD_OBJECTS);
const UTILITY_BUS_LAYOUT = getUtilityBusLayout();
const USEFUL_DIAGRAM_BOUNDS = getUsefulBoundsForWorldObjects(ELECTRICAL_ONE_LINE_WORLD_OBJECTS);

export function ElectricalOneLineDiagram({
  disconnectClosed,
  breakerTripped,
  feederContactor,
  solenoidContactor,
  motorPowered,
  gateOpen,
  voltage,
  current,
  frequency = SYSTEM.utility.nominalFrequency,
  powerFactor = 1.0,
  activePower = 0,
  reactivePower = 0,
  apparentPower = 0,
  generatorLiveStates,
  onToggleDisconnect,
  onToggleBreaker,
}: ElectricalOneLineProps) {
  const { t } = useTranslation();
  void feederContactor;
  void solenoidContactor;
  void motorPowered;
  void gateOpen;
  void onToggleDisconnect;
  void onToggleBreaker;
  const conductorMetrics = useConductorMetrics({ voltage, current, motorPowered, utilityActive: voltage > 0 });
  const conductorLabels = useMemo(() => conductorMetrics.map((metric) => metric.label), [conductorMetrics]);
  const conductorVoltages = useMemo(() => conductorMetrics.map((metric) => metric.lines[1]), [conductorMetrics]);
  const conductorCurrents = useMemo(() => conductorMetrics.map((metric) => metric.lines[2]), [conductorMetrics]);
  const conductorColors = useMemo(() => conductorMetrics.map((metric) => metric.color), [conductorMetrics]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const pinchStateRef = useRef<PinchState | null>(null);
  const activePointersRef = useRef(new Map<number, { x: number; y: number }>());
  const hasInitializedViewportRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [diagramSize, setDiagramSize] = useState({ width: 0, height: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const { state, utilityNode, supplementaryUtilityNodes, atsNode, generatorUnits } = useMemo(
    () =>
      buildElectricalModel(t, {
        voltage,
        current,
        frequency,
        powerFactor,
        activePower,
        reactivePower,
        apparentPower,
        generatorLiveStates,
        disconnectClosed,
        breakerTripped,
      }),
    [t, voltage, current, frequency, powerFactor, activePower, reactivePower, apparentPower, generatorLiveStates, disconnectClosed, breakerTripped],
  );

  const utilityDisplayNode = useMemo(
    () => ({
      ...utilityNode,
      icon: <Building2 className={cn('h-4 w-4', state.supplyLive ? 'text-[#00dcff]' : 'text-[#475569]')} />,
    }),
    [state.supplyLive, utilityNode],
  );

  const supplementaryUtilityDisplayNodes = useMemo(
    () =>
      supplementaryUtilityNodes.map((node) => ({
        ...node,
        icon: <StatusIcon icon={node.tag === 'UTIL-TEL' ? 'monitor' : 'power'} active={node.active} activeColor="text-[#00dcff]" />,
      })),
    [supplementaryUtilityNodes],
  );

  const atsDisplayNode: ATSNode = useMemo(
    () => ({
      ...atsNode,
      icon: <ShieldAlert className={cn('h-4 w-4', state.atsNormal ? 'text-[#00dcff]' : state.genLive ? 'text-[#ffb347]' : 'text-[#475569]')} />,
    }),
    [atsNode, state.atsNormal, state.genLive],
  );

  useEffect(() => {
    const updateLayoutMeasurements = () => {
      const diagram = diagramRef.current;
      if (diagram) setDiagramSize({ width: diagram.offsetWidth, height: diagram.offsetHeight });
      const viewport = viewportRef.current;
      if (viewport) setViewportSize({ width: viewport.clientWidth, height: viewport.clientHeight });
    };

    updateLayoutMeasurements();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateLayoutMeasurements);
      return () => window.removeEventListener('resize', updateLayoutMeasurements);
    }

    const observer = new ResizeObserver(() => updateLayoutMeasurements());
    if (diagramRef.current) observer.observe(diagramRef.current);
    window.addEventListener('resize', updateLayoutMeasurements);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateLayoutMeasurements);
    };
  }, []);

  const contentMetrics = useMemo(() => ({ width: diagramSize.width * BASE_DIAGRAM_SCALE * zoom, height: diagramSize.height * BASE_DIAGRAM_SCALE * zoom }), [diagramSize.height, diagramSize.width, zoom]);

  const getUsefulBoundsFramingOffset = useCallback((targetZoom: number) => {
    const usefulCenterX = (USEFUL_DIAGRAM_BOUNDS.x + USEFUL_DIAGRAM_BOUNDS.width / 2) * BASE_DIAGRAM_SCALE * targetZoom;
    const usefulCenterY = (USEFUL_DIAGRAM_BOUNDS.y + USEFUL_DIAGRAM_BOUNDS.height / 2) * BASE_DIAGRAM_SCALE * targetZoom;
    const contentWidth = diagramSize.width * BASE_DIAGRAM_SCALE * targetZoom;
    const contentHeight = diagramSize.height * BASE_DIAGRAM_SCALE * targetZoom;

    return {
      x: clampOffset(viewportSize.width / 2 - usefulCenterX, viewportSize.width, contentWidth),
      y: clampOffset(viewportSize.height / 2 - usefulCenterY, viewportSize.height, contentHeight),
    };
  }, [diagramSize.height, diagramSize.width, viewportSize.height, viewportSize.width]);

  const resetViewportToUsefulBounds = useCallback(() => {
    const defaultZoom = 1;
    setZoom(defaultZoom);
    setOffset(getUsefulBoundsFramingOffset(defaultZoom));
  }, [getUsefulBoundsFramingOffset]);

  useEffect(() => {
    if (hasInitializedViewportRef.current) return;
    if (!viewportSize.width || !viewportSize.height || !diagramSize.width || !diagramSize.height) return;

    setOffset(getUsefulBoundsFramingOffset(zoom));
    hasInitializedViewportRef.current = true;
  }, [diagramSize.height, diagramSize.width, getUsefulBoundsFramingOffset, viewportSize.height, viewportSize.width, zoom]);

  useEffect(() => {
    if (!viewportSize.width || !viewportSize.height) return;
    setOffset((current) => ({ x: clampOffset(current.x, viewportSize.width, contentMetrics.width), y: clampOffset(current.y, viewportSize.height, contentMetrics.height) }));
  }, [contentMetrics.height, contentMetrics.width, viewportSize.height, viewportSize.width]);

  const panBy = useCallback((deltaX: number, deltaY: number) => {
    setOffset((current) => ({
      x: clampOffset(current.x + deltaX, viewportSize.width, contentMetrics.width),
      y: clampOffset(current.y + deltaY, viewportSize.height, contentMetrics.height),
    }));
  }, [contentMetrics.height, contentMetrics.width, viewportSize.height, viewportSize.width]);

  const generatorBranchWireWidth = WORLD_GENERATOR_BRANCH_WIRE_WIDTH;
  const campusDividerHeight = generatorUnits.length * 74 + 24;
  const generatorBranchVerticalOffset = WORLD_GENERATOR_BRANCH_VERTICAL_OFFSET;

  const stopDragging = useCallback(() => {
    dragStateRef.current = null;
    pinchStateRef.current = null;
    if (activePointersRef.current.size <= 1) setIsDragging(false);
  }, []);

  const zoomAroundPoint = useCallback((nextZoom: number, pointerX: number, pointerY: number) => {
    if (!viewportRef.current || !diagramSize.width || !diagramSize.height) return;
    const clampedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    const nextContentWidth = diagramSize.width * BASE_DIAGRAM_SCALE * clampedZoom;
    const nextContentHeight = diagramSize.height * BASE_DIAGRAM_SCALE * clampedZoom;
    const contentX = (pointerX - offset.x) / zoom;
    const contentY = (pointerY - offset.y) / zoom;
    setZoom(clampedZoom);
    setOffset({
      x: clampOffset(pointerX - contentX * clampedZoom, viewportSize.width, nextContentWidth),
      y: clampOffset(pointerY - contentY * clampedZoom, viewportSize.height, nextContentHeight),
    });
  }, [diagramSize.height, diagramSize.width, offset.x, offset.y, viewportSize.height, viewportSize.width, zoom]);

  const zoomByStep = useCallback((delta: number) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    zoomAroundPoint(zoom + delta, rect.width / 2, rect.height / 2);
  }, [zoom, zoomAroundPoint]);

  useEffect(() => {
    const resetInteraction = () => {
      activePointersRef.current.clear();
      stopDragging();
    };
    window.addEventListener('pointercancel', resetInteraction);
    window.addEventListener('blur', resetInteraction);
    return () => {
      window.removeEventListener('pointercancel', resetInteraction);
      window.removeEventListener('blur', resetInteraction);
    };
  }, [stopDragging]);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!viewportRef.current) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea')) return;

    activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    event.currentTarget.setPointerCapture(event.pointerId);

    if (activePointersRef.current.size >= 2) {
      const entries = Array.from(activePointersRef.current.entries()).slice(0, 2);
      const [[firstId, first], [secondId, second]] = entries;
      const midpointX = (first.x + second.x) / 2;
      const midpointY = (first.y + second.y) / 2;
      const startDistance = Math.hypot(second.x - first.x, second.y - first.y) || 1;
      const rect = viewportRef.current.getBoundingClientRect();
      const pointerX = midpointX - rect.left;
      const pointerY = midpointY - rect.top;

      pinchStateRef.current = { pointerIds: [firstId, secondId], startDistance, startZoom: zoom, midpointX: pointerX, midpointY: pointerY, contentX: (pointerX - offset.x) / zoom, contentY: (pointerY - offset.y) / zoom };
      dragStateRef.current = null;
      setIsDragging(false);
      return;
    }

    pinchStateRef.current = null;
    dragStateRef.current = { startX: event.clientX, startY: event.clientY, offsetX: offset.x, offsetY: offset.y };
    setIsDragging(true);
  }, [offset.x, offset.y, zoom]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointersRef.current.has(event.pointerId)) activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const pinch = pinchStateRef.current;
    if (pinch) {
      const [firstId, secondId] = pinch.pointerIds;
      const first = activePointersRef.current.get(firstId);
      const second = activePointersRef.current.get(secondId);
      if (!first || !second) return;
      const distance = Math.hypot(second.x - first.x, second.y - first.y) || pinch.startDistance;
      const nextZoom = clamp(pinch.startZoom * (distance / pinch.startDistance), MIN_ZOOM, MAX_ZOOM);
      const nextContentWidth = diagramSize.width * BASE_DIAGRAM_SCALE * nextZoom;
      const nextContentHeight = diagramSize.height * BASE_DIAGRAM_SCALE * nextZoom;
      setZoom(nextZoom);
      setOffset({
        x: clampOffset(pinch.midpointX - pinch.contentX * nextZoom, viewportSize.width, nextContentWidth),
        y: clampOffset(pinch.midpointY - pinch.contentY * nextZoom, viewportSize.height, nextContentHeight),
      });
      return;
    }
    const drag = dragStateRef.current;
    if (!drag) return;
    setOffset({
      x: clampOffset(drag.offsetX + (event.clientX - drag.startX), viewportSize.width, contentMetrics.width),
      y: clampOffset(drag.offsetY + (event.clientY - drag.startY), viewportSize.height, contentMetrics.height),
    });
  }, [contentMetrics.height, contentMetrics.width, diagramSize.height, diagramSize.width, viewportSize.height, viewportSize.width]);

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    activePointersRef.current.delete(event.pointerId);

    if (activePointersRef.current.size >= 2) {
      const entries = Array.from(activePointersRef.current.entries()).slice(0, 2);
      const [[firstId, first], [secondId, second]] = entries;
      const midpointX = (first.x + second.x) / 2;
      const midpointY = (first.y + second.y) / 2;
      const rect = viewportRef.current?.getBoundingClientRect();
      if (rect) {
        const pointerX = midpointX - rect.left;
        const pointerY = midpointY - rect.top;
        pinchStateRef.current = { pointerIds: [firstId, secondId], startDistance: Math.hypot(second.x - first.x, second.y - first.y) || 1, startZoom: zoom, midpointX: pointerX, midpointY: pointerY, contentX: (pointerX - offset.x) / zoom, contentY: (pointerY - offset.y) / zoom };
      }
      setIsDragging(false);
      return;
    }

    pinchStateRef.current = null;
    const remainingPointer = Array.from(activePointersRef.current.values())[0];
    if (remainingPointer) {
      dragStateRef.current = { startX: remainingPointer.x, startY: remainingPointer.y, offsetX: offset.x, offsetY: offset.y };
      setIsDragging(true);
      return;
    }
    stopDragging();
  }, [offset.x, offset.y, stopDragging, zoom]);

  return (
    <div
      ref={viewportRef}
      tabIndex={0}
      aria-label="Electrical one-line diagram viewport"
      className={cn('relative h-full w-full overflow-hidden rounded-[28px] border border-[#163041] bg-[#050b10] select-none outline-none', 'cursor-grab active:cursor-grabbing touch-none', isDragging && 'cursor-grabbing')}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={stopDragging}
      onWheel={(event) => {
        event.preventDefault();
        const viewport = viewportRef.current;
        if (!viewport || !diagramSize.width || !diagramSize.height) return;
        const nextZoom = clamp(zoom - event.deltaY * ZOOM_STEP, MIN_ZOOM, MAX_ZOOM);
        if (nextZoom === zoom) return;
        const rect = viewport.getBoundingClientRect();
        zoomAroundPoint(nextZoom, event.clientX - rect.left, event.clientY - rect.top);
      }}
      onDoubleClick={() => {
        resetViewportToUsefulBounds();
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') { event.preventDefault(); panBy(PAN_STEP, 0); }
        if (event.key === 'ArrowRight') { event.preventDefault(); panBy(-PAN_STEP, 0); }
        if (event.key === 'ArrowUp') { event.preventDefault(); panBy(0, PAN_STEP); }
        if (event.key === 'ArrowDown') { event.preventDefault(); panBy(0, -PAN_STEP); }
        if ((event.key === '+' || event.key === '=') && !event.metaKey && !event.ctrlKey) { event.preventDefault(); zoomByStep(KEYBOARD_ZOOM_STEP); }
        if (event.key === '-' && !event.metaKey && !event.ctrlKey) { event.preventDefault(); zoomByStep(-KEYBOARD_ZOOM_STEP); }
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ backgroundColor: '#050b10', backgroundImage: `linear-gradient(rgba(5, 11, 16, 0.2), rgba(5, 11, 16, 0.72)), url(${niagaraFallsBackground})`, backgroundPosition: 'center center', backgroundRepeat: 'no-repeat', backgroundSize: 'cover', opacity: 0.55 }} />
      <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex items-center justify-between rounded-2xl border border-white/10 bg-black/35 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.22em] text-[#8fb3c9] backdrop-blur">
        <span>Drag to pan · Wheel/pinch or +/- to zoom</span>
        <div className="pointer-events-auto flex items-center gap-2">
          <button type="button" aria-label="Zoom out" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-black/35 text-sm text-[#d9f7ff] transition hover:border-[#2a6078] hover:bg-[#08131a]" onClick={() => zoomByStep(-BUTTON_ZOOM_STEP)}>−</button>
          <span className="min-w-14 text-center">{Math.round(zoom * 100)}%</span>
          <button type="button" aria-label="Zoom in" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-black/35 text-sm text-[#d9f7ff] transition hover:border-[#2a6078] hover:bg-[#08131a]" onClick={() => zoomByStep(BUTTON_ZOOM_STEP)}>+</button>
        </div>
      </div>
      <div className="absolute inset-0 overflow-hidden">
        <div className="pt-1 pb-8 pl-6 pr-10" style={{ width: diagramSize.width > 0 ? diagramSize.width * BASE_DIAGRAM_SCALE : undefined, height: diagramSize.height > 0 ? diagramSize.height * BASE_DIAGRAM_SCALE : undefined, transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, transformOrigin: 'top left', willChange: 'transform' }}>
          <div ref={diagramRef} className="min-w-max" style={{ transform: `scale(${BASE_DIAGRAM_SCALE})`, transformOrigin: 'top left' }}>
            <div className="flex items-center gap-0">
              <div className="relative shrink-0" style={{ width: UTILITY_BUS_GEOMETRY.width, height: UTILITY_BUS_GEOMETRY.height }}>
                <UtilityBusBackground utilityActive={state.supplyLive} />
                <UtilityBusAnnotations utilityActive={state.supplyLive} streetLabel={t.street} feederLabel="NPE-FDR-13.8-01" conductorLabels={conductorLabels} conductorVoltages={conductorVoltages} conductorCurrents={conductorCurrents} conductorColors={conductorColors} titleY={UTILITY_BUS_GEOMETRY.titleY} feederLabelY={UTILITY_BUS_GEOMETRY.feederLabelY} conductorLabelY={UTILITY_BUS_GEOMETRY.conductorLabelY} annotationWidth={UTILITY_BUS_GEOMETRY.annotationWidth} firstCX={UTILITY_BUS_LAYOUT.firstCX} hSpacing={UTILITY_BUS_GEOMETRY.hSpacing} busCenterX={UTILITY_BUS_LAYOUT.busCenterX} feederLabelX={UTILITY_BUS_LAYOUT.feederLabelX} />
                <div className="absolute left-0 flex items-start" style={{ zIndex: 1, top: UTILITY_BUS_GEOMETRY.lineTop - 98, gap: UTILITY_SUPPLEMENTARY_CARD_GAP }}>
                  {supplementaryUtilityDisplayNodes.map((node) => <NodeCard key={node.tag} node={node} />)}
                  <NodeCard node={utilityDisplayNode} />
                </div>
              </div>
              <div className="relative flex shrink-0 items-center" style={{ marginLeft: UTILITY_TO_RISER_GAP }}>
                <UtilityCardInterconnect active={state.supplyLive} cardCount={2} leadInWidth={UTILITY_TO_RISER_GAP} />
                <div className="relative z-[1]">
                  <NodeCard node={{ kind: 'equipment', tag: 'POLE-0326', title: t.riserPole, subtitle: t.structureLabel, status: t.riserPoleStatus, active: state.supplyLive, accent: 'cyan', width: 340, statusDot: true, miniStatuses: [
                    { label: t.surgeArresters, tag: 'LA-UTIL', status: 'Normal', active: state.supplyLive },
                    { label: t.fusedCutouts, tag: 'FCO-UTIL', status: state.supplyLive ? 'Closed' : 'Open', active: state.supplyLive },
                    { label: t.overheadUndergroundTransition, tag: t.overheadUndergroundTransition, status: state.supplyLive ? 'Connected' : 'Disconnected', active: state.supplyLive },
                  ] }} />
                </div>
                <div className="relative z-[1] shrink-0" style={{ marginLeft: UTILITY_CARD_GAP }}>
                  <BeaverWoodsMtCard active={state.supplyLive} frequency={frequency} generatorLiveStates={generatorLiveStates} conductorMetrics={conductorMetrics} />
                </div>
              </div>
              <div className="shrink-0">
                <NodeCard node={atsDisplayNode} />
              </div>
            </div>
            <div className="flex items-start" style={{ height: 28 }}><div style={{ width: generatorBranchVerticalOffset, flexShrink: 0 }} /></div>
            <GeneratorBank
              generatorUnits={generatorUnits}
              dividerLabel={t.campus}
              dividerHeight={campusDividerHeight}
              branchWireWidth={generatorBranchWireWidth}
              genBreakerNode={{ kind: 'equipment', tag: 'CB-GEN', title: t.mainPanelGen, status: state.genBrkLive ? t.closed : t.openStandby, active: state.genBrkLive, accent: 'amber', icon: <StatusIcon icon="shield" active={state.genBrkLive} activeColor="text-[#ffb347]" /> }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
