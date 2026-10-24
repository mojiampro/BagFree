"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { StarShape } from "@/components/stars";

const MIN = 0.5;
const MAX = 5;
const STEP = 0.5;

function clamp(value: number) {
  return Math.min(MAX, Math.max(MIN, value));
}

/** 0.5–5 star picker: hover/click with a mouse, tap or drag on touch screens, arrow keys on a keyboard. */
export function StarRatingInput({
  value,
  onChange,
  size = 40,
  labelledBy,
}: {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const dragging = useRef(false);

  function valueAt(clientX: number) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return value;
    const ratio = (clientX - rect.left) / rect.width;
    return clamp(Math.ceil((ratio * MAX) / STEP) * STEP);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    const next = valueAt(event.clientX);
    setHover(next);
    onChange(next);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" || dragging.current) {
      const next = valueAt(event.clientX);
      setHover(next);
      if (dragging.current) onChange(next);
    }
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    dragging.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (event.pointerType !== "mouse") setHover(null);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const keys: Record<string, number> = {
      ArrowRight: value + STEP,
      ArrowUp: value + STEP,
      ArrowLeft: value - STEP,
      ArrowDown: value - STEP,
      Home: MIN,
      End: MAX,
    };
    if (event.key in keys) {
      event.preventDefault();
      onChange(clamp(keys[event.key]));
    }
  }

  const shown = hover ?? value;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={value}
        aria-valuetext={`${value} ดาว`}
        aria-labelledby={labelledBy}
        className="flex cursor-pointer touch-none gap-1 rounded-xl p-1 outline-none select-none focus-visible:ring-2 focus-visible:ring-navy/40"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => {
          if (!dragging.current) setHover(null);
        }}
        onKeyDown={onKeyDown}
      >
        {[0, 1, 2, 3, 4].map((index) => (
          <span key={index} className="transition-transform duration-150 hover:scale-110">
            <StarShape fill={shown - index} size={size} />
          </span>
        ))}
      </div>
      <p className="text-sm font-semibold text-ink tabular-nums">{shown.toFixed(1)} / 5</p>
    </div>
  );
}
