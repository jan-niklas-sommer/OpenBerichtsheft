import { useRef, useCallback, useEffect } from "react";

const DRAG_THRESHOLD = 5;
const DECELERATION = 0.85;
const MIN_VELOCITY = 0.3;
const MAX_VELOCITY = 20;

interface UseDragScrollOptions {
  onScrollNearEdge?: (direction: "start" | "end") => void;
}

export function useDragScroll({ onScrollNearEdge }: UseDragScrollOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const isPointerDownRef = useRef(false);
  const dragMovedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, scrollLeft: 0 });
  const lastPosRef = useRef({ x: 0, time: 0 });
  const velocityRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const dragConsumedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const momentumLoopRef = useRef<() => void>(() => {});

  useEffect(() => {
    momentumLoopRef.current = () => {
      const el = containerRef.current;
      if (!el || Math.abs(velocityRef.current) < MIN_VELOCITY) {
        velocityRef.current = 0;
        return;
      }
      el.scrollLeft -= velocityRef.current;
      velocityRef.current *= DECELERATION;

      if (onScrollNearEdge && el.scrollLeft < el.clientWidth * 0.3) {
        onScrollNearEdge("start");
      }
      if (
        onScrollNearEdge &&
        el.scrollLeft + el.clientWidth > el.scrollWidth - el.clientWidth * 0.3
      ) {
        onScrollNearEdge("end");
      }

      animFrameRef.current = requestAnimationFrame(momentumLoopRef.current);
    };
  }, [onScrollNearEdge]);

  const touchMoveHandlerRef = useRef<(e: TouchEvent) => void>(() => {});
  const touchEndHandlerRef = useRef<(e: Event) => void>(() => {});

  useEffect(() => {
    touchMoveHandlerRef.current = (e: TouchEvent) => {
      const clientX = e.touches[0].clientX;
      const el = containerRef.current;
      if (!el) return;

      const dx = clientX - dragStartRef.current.x;
      if (Math.abs(dx) > DRAG_THRESHOLD) {
        isDraggingRef.current = true;
        dragMovedRef.current = true;
        e.preventDefault();
      }

      if (isDraggingRef.current) {
        el.scrollLeft = dragStartRef.current.scrollLeft - dx;
      }

      const now = Date.now();
      const dt = now - lastPosRef.current.time;
      if (dt > 0) {
        velocityRef.current = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, (clientX - lastPosRef.current.x) / dt * 8));
      }
      lastPosRef.current = { x: clientX, time: now };
    };

    touchEndHandlerRef.current = (e: Event) => {
      const target = e.target as HTMLElement;
      target.removeEventListener("touchmove", touchMoveHandlerRef.current);
      target.removeEventListener("touchend", touchEndHandlerRef.current);
      target.removeEventListener("touchcancel", touchEndHandlerRef.current);

      if (isDraggingRef.current && Math.abs(velocityRef.current) > MIN_VELOCITY) {
        animFrameRef.current = requestAnimationFrame(momentumLoopRef.current);
      }
      setTimeout(() => {
        dragConsumedRef.current = isDraggingRef.current;
        isDraggingRef.current = false;
      }, 0);
    };
  }, [onScrollNearEdge]);

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      velocityRef.current = 0;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const el = containerRef.current;
      if (!el) return;

      isPointerDownRef.current = true;
      isDraggingRef.current = false;
      dragMovedRef.current = false;
      dragConsumedRef.current = false;
      dragStartRef.current = { x: clientX, scrollLeft: el.scrollLeft };
      lastPosRef.current = { x: clientX, time: Date.now() };

      if ("touches" in e) {
        e.currentTarget.addEventListener("touchmove", touchMoveHandlerRef.current as EventListener, {
          passive: false,
        });
        e.currentTarget.addEventListener("touchend", touchEndHandlerRef.current as EventListener);
        e.currentTarget.addEventListener("touchcancel", touchEndHandlerRef.current as EventListener);
      }
    },
    [],
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPointerDownRef.current) return;
    const el = containerRef.current;
    if (!el) return;

    const dx = e.clientX - dragStartRef.current.x;

    if (!isDraggingRef.current && Math.abs(dx) > DRAG_THRESHOLD) {
      isDraggingRef.current = true;
      dragMovedRef.current = true;
    }

    if (isDraggingRef.current) {
      el.scrollLeft = dragStartRef.current.scrollLeft - dx;

      const now = Date.now();
      const dt = now - lastPosRef.current.time;
      if (dt > 0) {
        velocityRef.current = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, (e.clientX - lastPosRef.current.x) / dt * 8));
      }
      lastPosRef.current = { x: e.clientX, time: now };
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isPointerDownRef.current = false;
    if (isDraggingRef.current && Math.abs(velocityRef.current) > MIN_VELOCITY) {
      animFrameRef.current = requestAnimationFrame(momentumLoopRef.current);
    }
    setTimeout(() => {
      dragConsumedRef.current = isDraggingRef.current;
      isDraggingRef.current = false;
    }, 0);
  }, []);

  const wasDragged = useCallback(() => {
    return dragConsumedRef.current;
  }, []);

  return {
    containerRef,
    handlePointerDown,
    handleMouseMove,
    handleMouseUp,
    wasDragged,
    isDragging: isDraggingRef,
  };
}
