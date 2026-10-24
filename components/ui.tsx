import type { ReactNode } from "react";
import { AlertIcon, Spinner } from "@/components/icons";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // Orange is reserved for the main call to action on a screen.
  primary: "bg-cta text-white font-bold shadow-sm hover:bg-cta-hover hover:shadow-md",
  secondary: "border-2 border-navy bg-white text-navy font-semibold hover:bg-navy-soft",
  ghost: "text-navy font-medium hover:bg-navy-soft",
  danger: "border-2 border-danger bg-white text-danger font-semibold hover:bg-danger-soft",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra = "") {
  return [
    "inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-200",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    extra,
  ].join(" ");
}

export const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 h-11 text-sm text-ink placeholder:text-muted/70 transition focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15 disabled:bg-alt aria-[invalid=true]:border-danger";

export const cardClass = "rounded-2xl border border-line bg-card shadow-sm";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string | null;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function LoadingState({ label = "กำลังโหลด..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted" role="status">
      <Spinner className="text-3xl text-navy" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({
  title = "เกิดข้อผิดพลาด",
  message,
  action,
}: {
  title?: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-danger/30 bg-danger-soft/40 px-6 py-10 text-center" role="alert">
      <AlertIcon className="text-3xl text-danger" />
      <p className="font-semibold text-ink">{title}</p>
      <p className="max-w-md text-sm text-muted">{message}</p>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-card px-6 py-12 text-center">
      {icon ? <div className="text-4xl text-muted">{icon}</div> : null}
      <p className="font-semibold text-ink">{title}</p>
      {message ? <p className="max-w-md text-sm text-muted">{message}</p> : null}
      {action}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-alt ${className}`} />;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      {eyebrow ? (
        <p className="mb-2 text-sm font-semibold tracking-wide text-cta">{eyebrow}</p>
      ) : null}
      <h2 className="text-2xl font-bold text-navy @2xl:text-3xl">{title}</h2>
      {description ? <p className="mt-3 text-muted">{description}</p> : null}
    </div>
  );
}
