"use client";

import { useSyncExternalStore } from "react";
import { MonitorIcon, SmartphoneIcon } from "@/components/icons";

export const VIEW_STORAGE_KEY = "bf-view";

/** Runs before first paint (see app/layout.tsx) so the saved view never flashes. */
export const VIEW_INIT_SCRIPT = `try{if(localStorage.getItem("${VIEW_STORAGE_KEY}")==="phone")document.documentElement.dataset.view="phone"}catch(e){}`;

type View = "phone" | "full";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-view"] });
  return () => observer.disconnect();
}

function getView(): View {
  return document.documentElement.dataset.view === "phone" ? "phone" : "full";
}

function setView(next: View) {
  const root = document.documentElement;
  if (next === "phone") root.setAttribute("data-view", "phone");
  else root.removeAttribute("data-view");
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, next);
  } catch {
    // Storage can be unavailable (private mode); the toggle still works for this visit.
  }
}

export function ViewToggle() {
  const view = useSyncExternalStore<View>(subscribe, getView, () => "full");

  return (
    <div
      className="fixed right-5 bottom-5 z-[60] hidden items-center gap-1 rounded-full border border-line bg-white/95 p-1 shadow-lg backdrop-blur sm:flex"
      role="radiogroup"
      aria-label="มุมมองการแสดงผล"
    >
      {(
        [
          { value: "phone", label: "Phone View", icon: <SmartphoneIcon /> },
          { value: "full", label: "Full Screen", icon: <MonitorIcon /> },
        ] as const
      ).map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={view === option.value}
          onClick={() => setView(option.value)}
          className={`flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition ${
            view === option.value ? "bg-navy text-white" : "text-muted hover:bg-alt hover:text-navy"
          }`}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
