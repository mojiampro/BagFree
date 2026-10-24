"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from "react";
import { AdArt } from "@/components/ads/ad-art";
import { ArrowLeftIcon, ArrowRightIcon, MapPinIcon, TagIcon } from "@/components/icons";
import { useAuth } from "@/components/providers/auth-provider";
import { buttonClass } from "@/components/ui";
import { AD_CATEGORY_LABELS, AD_SLIDES, adBookingHref, type AdSlide } from "@/lib/ads";

const SWIPE_THRESHOLD_PX = 40;

function subscribeReducedMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

function SlideCard({
  slide,
  branchId,
  index,
  total,
  active,
  compact,
  onCta,
}: {
  slide: AdSlide;
  branchId: number | null;
  index: number;
  total: number;
  active: boolean;
  compact: boolean;
  onCta: (href: string) => void;
}) {
  const cta = slide.promoCode ? "จองส่งกระเป๋าเลย" : `ฝากกระเป๋าที่ ${slide.branchName} แล้วไปเที่ยว`;
  return (
    <article
      className={`flex w-full shrink-0 flex-col ${compact ? "" : "@2xl:flex-row"}`}
      role="group"
      aria-roledescription="สไลด์"
      aria-label={`${index + 1} จาก ${total}: ${slide.title}`}
      inert={!active}
    >
      <div className={`relative aspect-[16/10] overflow-hidden ${compact ? "" : "@2xl:aspect-auto @2xl:w-1/2"}`}>
        <AdArt kind={slide.art} />
        <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-navy shadow-sm">
          {AD_CATEGORY_LABELS[slide.category]}
        </span>
        <span className="absolute top-3 right-3 rounded-md bg-ink/60 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white">
          โฆษณา
        </span>
      </div>
      <div className={`flex flex-1 flex-col gap-2 p-5 ${compact ? "" : "@2xl:justify-center @2xl:p-8"}`}>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-highlight px-2.5 py-1 text-xs font-semibold text-cta-hover">
          {slide.promoCode ? (
            <>
              <TagIcon /> โค้ด <span className="font-mono">{slide.promoCode}</span>
            </>
          ) : (
            <>
              <MapPinIcon /> ใกล้สาขา {slide.branchName}
            </>
          )}
        </span>
        <h3 className={`font-bold text-navy ${compact ? "text-lg" : "text-lg @2xl:text-2xl"}`}>{slide.title}</h3>
        <p className="text-sm leading-relaxed text-muted">{slide.description}</p>
        <button type="button" onClick={() => onCta(adBookingHref(slide, branchId))} className={buttonClass("primary", "sm", "mt-2 w-fit")}>
          {cta}
        </button>
      </div>
    </article>
  );
}

/**
 * Accessible auto-playing carousel: pauses on hover, focus, a hidden tab or the pause button,
 * respects prefers-reduced-motion, and supports swipe and arrow keys.
 */
export function PromoSlider({
  branchIds,
  interval = 5000,
  compact = false,
  onNavigate,
  label = "แนะนำที่เที่ยวใกล้สถานี",
}: {
  /** Branch name → id, used to preselect the branch when booking. */
  branchIds: Record<string, number>;
  interval?: number;
  compact?: boolean;
  onNavigate?: () => void;
  label?: string;
}) {
  const { requireAuth } = useAuth();
  const regionId = useId();
  const slides = AD_SLIDES;
  const total = slides.length;
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  const tabHidden = useSyncExternalStore(subscribeVisibility, () => document.hidden, () => false);
  const swipeStart = useRef<number | null>(null);

  const playing = !userPaused && !hovered && !focused && !tabHidden && !reducedMotion;

  const go = useCallback((next: number) => setIndex(((next % total) + total) % total), [total]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => go(index + 1), interval);
    return () => window.clearTimeout(timer);
  }, [playing, index, interval, go]);

  function handleCta(href: string) {
    onNavigate?.();
    requireAuth(href);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    swipeStart.current = event.clientX;
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (swipeStart.current === null) return;
    const dx = event.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(dx) > SWIPE_THRESHOLD_PX) go(index + (dx < 0 ? 1 : -1));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") go(index + 1);
    else if (event.key === "ArrowLeft") go(index - 1);
    else return;
    event.preventDefault();
  }

  return (
    <section
      id={regionId}
      aria-roledescription="ภาพสไลด์"
      aria-label={label}
      className="relative overflow-hidden rounded-2xl border border-line bg-card shadow-sm"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
      onKeyDown={onKeyDown}
    >
      <div className="relative touch-pan-y select-none" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => (swipeStart.current = null)}>
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
          aria-live={playing ? "off" : "polite"}
        >
          {slides.map((slide, i) => (
            <SlideCard
              key={slide.id}
              slide={slide}
              branchId={slide.branchName ? (branchIds[slide.branchName] ?? null) : null}
              index={i}
              total={total}
              active={i === index}
              compact={compact}
              onCta={handleCta}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(index - 1)}
          className="absolute top-[30%] left-2 grid size-9 cursor-pointer place-items-center rounded-full bg-white/90 text-navy shadow-md transition hover:scale-105 hover:bg-white"
          aria-controls={regionId}
          aria-label="สไลด์ก่อนหน้า"
        >
          <ArrowLeftIcon />
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          className="absolute top-[30%] right-2 grid size-9 cursor-pointer place-items-center rounded-full bg-white/90 text-navy shadow-md transition hover:scale-105 hover:bg-white"
          aria-controls={regionId}
          aria-label="สไลด์ถัดไป"
        >
          <ArrowRightIcon />
        </button>
      </div>

      <div className="flex items-center gap-3 border-t border-line px-4 py-3">
        <button
          type="button"
          onClick={() => setUserPaused((paused) => !paused)}
          className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-full text-xs font-bold text-navy transition hover:bg-alt"
          aria-label={userPaused ? "เล่นสไลด์อัตโนมัติ" : "หยุดสไลด์อัตโนมัติ"}
          aria-pressed={userPaused}
          hidden={reducedMotion}
        >
          {userPaused ? "▶" : "❚❚"}
        </button>
        <div className="flex flex-1 items-center justify-center gap-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => go(i)}
              className={`relative h-2 cursor-pointer overflow-hidden rounded-full transition-all duration-300 ${
                i === index ? "w-8 bg-navy/20" : "w-2 bg-line hover:bg-muted/50"
              }`}
              aria-label={`ไปสไลด์ที่ ${i + 1}`}
              aria-current={i === index}
            >
              {i === index ? (
                <span
                  key={`${index}-${playing}`}
                  className={`absolute inset-0 origin-left rounded-full bg-navy ${playing ? "ad-progress" : ""}`}
                  style={playing ? { animationDuration: `${interval}ms` } : undefined}
                />
              ) : null}
            </button>
          ))}
        </div>
        <span className="w-7 shrink-0 text-right text-xs text-muted tabular-nums">
          {index + 1}/{total}
        </span>
      </div>
    </section>
  );
}
