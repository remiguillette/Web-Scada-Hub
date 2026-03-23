import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { cn } from "@/lib/utils";
import niagaraFallsBackground from "@/assets/Niagarafallspng1500.png";

const PAN_OVERSCROLL = 280;
const PAN_STEP = 120;
const MIN_ZOOM = 0.15;
const MAX_ZOOM = 2.6;
const ZOOM_STEP = 0.0015;
const KEYBOARD_ZOOM_STEP = 0.1;
const BUTTON_ZOOM_STEP = 0.15;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function clampOffset(
  offset: number,
  viewportSize: number,
  contentSize: number,
) {
  if (contentSize <= viewportSize) {
    return (viewportSize - contentSize) / 2;
  }

  return clamp(
    offset,
    viewportSize - contentSize - PAN_OVERSCROLL,
    PAN_OVERSCROLL,
  );
}

type DragState = {
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
};

type PinchState = {
  pointerIds: [number, number];
  startDistance: number;
  startZoom: number;
  midpointX: number;
  midpointY: number;
  contentX: number;
  contentY: number;
};

export type DiagramViewportRenderProps = {
  diagramRef: RefObject<HTMLDivElement | null>;
  zoom: number;
  offset: { x: number; y: number };
  isDragging: boolean;
  diagramSize: { width: number; height: number };
  viewportSize: { width: number; height: number };
};

interface DiagramViewportProps {
  baseScale: number;
  children: (props: DiagramViewportRenderProps) => ReactNode;
}

export function DiagramViewport({ baseScale, children }: DiagramViewportProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const pinchStateRef = useRef<PinchState | null>(null);
  const activePointersRef = useRef(new Map<number, { x: number; y: number }>());
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [diagramSize, setDiagramSize] = useState({ width: 0, height: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  const contentMetrics = useMemo(() => {
    const width = diagramSize.width * baseScale * zoom;
    const height = diagramSize.height * baseScale * zoom;

    return { width, height };
  }, [baseScale, diagramSize.height, diagramSize.width, zoom]);

  useEffect(() => {
    const updateLayoutMeasurements = () => {
      const diagram = diagramRef.current;
      if (diagram) {
        setDiagramSize({
          width: diagram.offsetWidth,
          height: diagram.offsetHeight,
        });
      }

      const viewport = viewportRef.current;
      if (viewport) {
        setViewportSize({
          width: viewport.clientWidth,
          height: viewport.clientHeight,
        });
      }
    };

    updateLayoutMeasurements();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateLayoutMeasurements);
      return () =>
        window.removeEventListener("resize", updateLayoutMeasurements);
    }

    const observer = new ResizeObserver(updateLayoutMeasurements);
    if (diagramRef.current) observer.observe(diagramRef.current);
    if (viewportRef.current) observer.observe(viewportRef.current);
    window.addEventListener("resize", updateLayoutMeasurements);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateLayoutMeasurements);
    };
  }, []);

  useEffect(() => {
    if (!viewportSize.width || !viewportSize.height) return;

    setOffset((current) => ({
      x: clampOffset(current.x, viewportSize.width, contentMetrics.width),
      y: clampOffset(current.y, viewportSize.height, contentMetrics.height),
    }));
  }, [
    contentMetrics.height,
    contentMetrics.width,
    viewportSize.height,
    viewportSize.width,
  ]);

  const panBy = useCallback(
    (deltaX: number, deltaY: number) => {
      setOffset((current) => ({
        x: clampOffset(
          current.x + deltaX,
          viewportSize.width,
          contentMetrics.width,
        ),
        y: clampOffset(
          current.y + deltaY,
          viewportSize.height,
          contentMetrics.height,
        ),
      }));
    },
    [
      contentMetrics.height,
      contentMetrics.width,
      viewportSize.height,
      viewportSize.width,
    ],
  );

  const stopDragging = useCallback(() => {
    dragStateRef.current = null;
    pinchStateRef.current = null;
    if (activePointersRef.current.size <= 1) {
      setIsDragging(false);
    }
  }, []);

  const zoomAroundPoint = useCallback(
    (nextZoom: number, pointerX: number, pointerY: number) => {
      if (!viewportRef.current || !diagramSize.width || !diagramSize.height)
        return;

      const clampedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
      const nextContentWidth = diagramSize.width * baseScale * clampedZoom;
      const nextContentHeight = diagramSize.height * baseScale * clampedZoom;
      const contentX = (pointerX - offset.x) / zoom;
      const contentY = (pointerY - offset.y) / zoom;

      setZoom(clampedZoom);
      setOffset({
        x: clampOffset(
          pointerX - contentX * clampedZoom,
          viewportSize.width,
          nextContentWidth,
        ),
        y: clampOffset(
          pointerY - contentY * clampedZoom,
          viewportSize.height,
          nextContentHeight,
        ),
      });
    },
    [
      baseScale,
      diagramSize.height,
      diagramSize.width,
      offset.x,
      offset.y,
      viewportSize.height,
      viewportSize.width,
      zoom,
    ],
  );

  const zoomByStep = useCallback(
    (delta: number) => {
      if (!viewportRef.current) return;

      const rect = viewportRef.current.getBoundingClientRect();
      zoomAroundPoint(zoom + delta, rect.width / 2, rect.height / 2);
    },
    [zoom, zoomAroundPoint],
  );

  useEffect(() => {
    const resetInteraction = () => {
      activePointersRef.current.clear();
      stopDragging();
    };

    window.addEventListener("pointercancel", resetInteraction);
    window.addEventListener("blur", resetInteraction);
    return () => {
      window.removeEventListener("pointercancel", resetInteraction);
      window.removeEventListener("blur", resetInteraction);
    };
  }, [stopDragging]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!viewportRef.current) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;

      const target = event.target as HTMLElement;
      if (target.closest("button, a, input, select, textarea")) return;

      activePointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      event.currentTarget.setPointerCapture(event.pointerId);

      if (activePointersRef.current.size >= 2) {
        const entries = Array.from(activePointersRef.current.entries()).slice(
          0,
          2,
        );
        const [[firstId, first], [secondId, second]] = entries;
        const midpointX = (first.x + second.x) / 2;
        const midpointY = (first.y + second.y) / 2;
        const startDistance =
          Math.hypot(second.x - first.x, second.y - first.y) || 1;
        const rect = viewportRef.current.getBoundingClientRect();
        const pointerX = midpointX - rect.left;
        const pointerY = midpointY - rect.top;

        pinchStateRef.current = {
          pointerIds: [firstId, secondId],
          startDistance,
          startZoom: zoom,
          midpointX: pointerX,
          midpointY: pointerY,
          contentX: (pointerX - offset.x) / zoom,
          contentY: (pointerY - offset.y) / zoom,
        };
        dragStateRef.current = null;
        setIsDragging(false);
        return;
      }

      pinchStateRef.current = null;
      dragStateRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        offsetX: offset.x,
        offsetY: offset.y,
      };
      setIsDragging(true);
    },
    [offset.x, offset.y, zoom],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (activePointersRef.current.has(event.pointerId)) {
        activePointersRef.current.set(event.pointerId, {
          x: event.clientX,
          y: event.clientY,
        });
      }

      const pinch = pinchStateRef.current;
      if (pinch) {
        const [firstId, secondId] = pinch.pointerIds;
        const first = activePointersRef.current.get(firstId);
        const second = activePointersRef.current.get(secondId);
        if (!first || !second) return;

        const distance =
          Math.hypot(second.x - first.x, second.y - first.y) ||
          pinch.startDistance;
        const nextZoom = clamp(
          pinch.startZoom * (distance / pinch.startDistance),
          MIN_ZOOM,
          MAX_ZOOM,
        );
        const nextContentWidth = diagramSize.width * baseScale * nextZoom;
        const nextContentHeight = diagramSize.height * baseScale * nextZoom;

        setZoom(nextZoom);
        setOffset({
          x: clampOffset(
            pinch.midpointX - pinch.contentX * nextZoom,
            viewportSize.width,
            nextContentWidth,
          ),
          y: clampOffset(
            pinch.midpointY - pinch.contentY * nextZoom,
            viewportSize.height,
            nextContentHeight,
          ),
        });
        return;
      }

      const drag = dragStateRef.current;
      if (!drag) return;

      setOffset({
        x: clampOffset(
          drag.offsetX + (event.clientX - drag.startX),
          viewportSize.width,
          contentMetrics.width,
        ),
        y: clampOffset(
          drag.offsetY + (event.clientY - drag.startY),
          viewportSize.height,
          contentMetrics.height,
        ),
      });
    },
    [
      baseScale,
      contentMetrics.height,
      contentMetrics.width,
      diagramSize.height,
      diagramSize.width,
      viewportSize.height,
      viewportSize.width,
    ],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      activePointersRef.current.delete(event.pointerId);

      if (activePointersRef.current.size >= 2) {
        const entries = Array.from(activePointersRef.current.entries()).slice(
          0,
          2,
        );
        const [[firstId, first], [secondId, second]] = entries;
        const midpointX = (first.x + second.x) / 2;
        const midpointY = (first.y + second.y) / 2;
        const rect = viewportRef.current?.getBoundingClientRect();
        if (rect) {
          const pointerX = midpointX - rect.left;
          const pointerY = midpointY - rect.top;
          pinchStateRef.current = {
            pointerIds: [firstId, secondId],
            startDistance:
              Math.hypot(second.x - first.x, second.y - first.y) || 1,
            startZoom: zoom,
            midpointX: pointerX,
            midpointY: pointerY,
            contentX: (pointerX - offset.x) / zoom,
            contentY: (pointerY - offset.y) / zoom,
          };
        }
        setIsDragging(false);
        return;
      }

      pinchStateRef.current = null;

      const remainingPointer = Array.from(
        activePointersRef.current.values(),
      )[0];
      if (remainingPointer) {
        dragStateRef.current = {
          startX: remainingPointer.x,
          startY: remainingPointer.y,
          offsetX: offset.x,
          offsetY: offset.y,
        };
        setIsDragging(true);
        return;
      }

      stopDragging();
    },
    [offset.x, offset.y, stopDragging, zoom],
  );

  return (
    <div
      ref={viewportRef}
      tabIndex={0}
      aria-label="Electrical one-line diagram viewport"
      className={cn(
        "relative h-full w-full overflow-hidden rounded-[28px] border border-[#163041] bg-[#050b10] select-none outline-none",
        "cursor-grab active:cursor-grabbing touch-none",
        isDragging && "cursor-grabbing",
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={stopDragging}
      onWheel={(event) => {
        event.preventDefault();

        const viewport = viewportRef.current;
        if (!viewport || !diagramSize.width || !diagramSize.height) return;

        const nextZoom = clamp(
          zoom - event.deltaY * ZOOM_STEP,
          MIN_ZOOM,
          MAX_ZOOM,
        );
        if (nextZoom === zoom) return;

        const rect = viewport.getBoundingClientRect();
        zoomAroundPoint(
          nextZoom,
          event.clientX - rect.left,
          event.clientY - rect.top,
        );
      }}
      onDoubleClick={() => {
        setZoom(1);
        setOffset({
          x: clampOffset(0, viewportSize.width, diagramSize.width * baseScale),
          y: clampOffset(
            0,
            viewportSize.height,
            diagramSize.height * baseScale,
          ),
        });
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          panBy(PAN_STEP, 0);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          panBy(-PAN_STEP, 0);
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          panBy(0, PAN_STEP);
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          panBy(0, -PAN_STEP);
        }
        if (
          (event.key === "+" || event.key === "=") &&
          !event.metaKey &&
          !event.ctrlKey
        ) {
          event.preventDefault();
          zoomByStep(KEYBOARD_ZOOM_STEP);
        }
        if (event.key === "-" && !event.metaKey && !event.ctrlKey) {
          event.preventDefault();
          zoomByStep(-KEYBOARD_ZOOM_STEP);
        }
      }}
    >
      <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex items-center justify-between rounded-2xl border border-white/10 bg-black/35 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.22em] text-[#8fb3c9] backdrop-blur">
        <span>Drag to pan · Wheel/pinch or +/- to zoom</span>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            aria-label="Zoom out"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-black/35 text-sm text-[#d9f7ff] transition hover:border-[#2a6078] hover:bg-[#08131a]"
            onClick={() => zoomByStep(-BUTTON_ZOOM_STEP)}
          >
            −
          </button>
          <span className="min-w-14 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            aria-label="Zoom in"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-black/35 text-sm text-[#d9f7ff] transition hover:border-[#2a6078] hover:bg-[#08131a]"
            onClick={() => zoomByStep(BUTTON_ZOOM_STEP)}
          >
            +
          </button>
        </div>
      </div>

      <div className="absolute inset-0 overflow-hidden">
        <div
          className="relative pt-1 pb-8 pl-6 pr-10"
          style={{
            width:
              diagramSize.width > 0 ? diagramSize.width * baseScale : undefined,
            height:
              diagramSize.height > 0
                ? diagramSize.height * baseScale
                : undefined,
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: "top left",
            willChange: "transform",
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 z-0"
            style={{
              width:
                diagramSize.width > 0
                  ? diagramSize.width * baseScale
                  : undefined,
              height:
                diagramSize.height > 0
                  ? diagramSize.height * baseScale
                  : undefined,
              backgroundColor: "#050b10",
              backgroundImage: `linear-gradient(rgba(5, 11, 16, 0.2), rgba(5, 11, 16, 0.72)), url(${niagaraFallsBackground})`,
              backgroundPosition: "center center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              opacity: 0.55,
            }}
          />
          <div className="relative z-10">
            {children({
              diagramRef,
              zoom,
              offset,
              isDragging,
              diagramSize,
              viewportSize,
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
