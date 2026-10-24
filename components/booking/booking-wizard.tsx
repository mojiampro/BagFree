"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BagCounter } from "@/components/booking/bag-counter";
import { HotelSearch } from "@/components/booking/hotel-search";
import { PriceSummary } from "@/components/booking/price-summary";
import { StepIndicator } from "@/components/booking/step-indicator";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BuildingIcon,
  LuggageIcon,
  Spinner,
  TagIcon,
  TrainIcon,
  TruckIcon,
} from "@/components/icons";
import { buttonClass, cardClass, Field, inputClass } from "@/components/ui";
import type { BookingRequest, CreateBookingResponse, DiscountResponse } from "@/lib/booking-request";
import { isValidThaiPhone, normalizePhone } from "@/lib/format";
import { haversineKm } from "@/lib/geo";
import { emptyBagCounts, priceDelivery, priceStorage, storageDays, totalBags, type BagCounts } from "@/lib/pricing";
import { DELIVERY_MODE_LABELS, SERVICE_LABELS } from "@/lib/status";
import { bangkokLocalToIso, formatDateTime, formatOpeningHours, isWithinOpeningHours } from "@/lib/time";
import type { Branch, DeliveryMode, Place, ServiceType } from "@/lib/types";

/** Road distance is usually ~30% longer than a straight line; the server replaces this with OSRM. */
const ROAD_FACTOR = 1.3;

export interface WizardDefaults {
  now: string;
  scheduled: string;
  storageStart: string;
  storageEnd: string;
}

type Errors = Partial<Record<string, string>>;

const MODES: { value: DeliveryMode; icons: [typeof TrainIcon, typeof TrainIcon] }[] = [
  { value: "branch_to_hotel", icons: [TrainIcon, BuildingIcon] },
  { value: "hotel_to_branch", icons: [BuildingIcon, TrainIcon] },
  { value: "branch_to_branch", icons: [TrainIcon, TrainIcon] },
];

function BranchSelect({
  id,
  branches,
  value,
  onChange,
  exclude,
  invalid,
}: {
  id: string;
  branches: Branch[];
  value: number | null;
  onChange: (id: number | null) => void;
  exclude?: number | null;
  invalid?: boolean;
}) {
  return (
    <select
      id={id}
      className={inputClass}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
      aria-invalid={invalid}
    >
      <option value="">— เลือกสาขา —</option>
      {branches
        .filter((branch) => branch.id !== exclude)
        .map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name} ({formatOpeningHours(branch)})
          </option>
        ))}
    </select>
  );
}

export function BookingWizard({
  branches,
  initialService,
  defaults,
}: {
  branches: Branch[];
  initialService: ServiceType | null;
  defaults: WizardDefaults;
}) {
  const router = useRouter();
  const [step, setStep] = useState(initialService ? 1 : 0);
  const [service, setService] = useState<ServiceType | null>(initialService);
  const [mode, setMode] = useState<DeliveryMode>("branch_to_hotel");
  const [originBranch, setOriginBranch] = useState<number | null>(null);
  const [destinationBranch, setDestinationBranch] = useState<number | null>(null);
  const [hotel, setHotel] = useState<Place | null>(null);
  const [scheduled, setScheduled] = useState(defaults.scheduled);
  const [storageBranch, setStorageBranch] = useState<number | null>(null);
  const [storageStart, setStorageStart] = useState(defaults.storageStart);
  const [storageEnd, setStorageEnd] = useState(defaults.storageEnd);
  const [sender, setSender] = useState("");
  const [receiver, setReceiver] = useState("");
  const [phone, setPhone] = useState("");
  const [bags, setBags] = useState<BagCounts>(emptyBagCounts);
  const [errors, setErrors] = useState<Errors>({});

  const [codeInput, setCodeInput] = useState("");
  const [discount, setDiscount] = useState<DiscountResponse | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const branchById = (id: number | null) => branches.find((branch) => branch.id === id) ?? null;

  const endpoints = {
    from: mode === "hotel_to_branch" ? hotel : branchById(originBranch),
    to: mode === "branch_to_hotel" ? hotel : branchById(destinationBranch),
  };

  const preview = (() => {
    if (!service || totalBags(bags) === 0) return null;
    if (service === "storage") {
      const start = bangkokLocalToIso(storageStart);
      const end = bangkokLocalToIso(storageEnd);
      if (!start || !end) return null;
      return { price: priceStorage(bags, new Date(start), new Date(end)), estimatedKm: null };
    }
    if (!endpoints.from || !endpoints.to) return null;
    const km = haversineKm(endpoints.from, endpoints.to) * ROAD_FACTOR;
    return { price: priceDelivery(bags, km), estimatedKm: km };
  })();

  function chooseService(value: ServiceType) {
    setService(value);
    setErrors({});
    setDiscount(null);
    setStep(1);
  }

  function validateDetails(): Errors {
    const next: Errors = {};
    const nowMs = new Date(defaults.now).getTime() - 10 * 60 * 1000;

    if (service === "delivery") {
      if (mode !== "hotel_to_branch" && !originBranch) next.originBranch = "กรุณาเลือกสาขาต้นทาง";
      if (mode !== "branch_to_hotel" && !destinationBranch) next.destinationBranch = "กรุณาเลือกสาขาปลายทาง";
      if (mode === "branch_to_branch" && originBranch && originBranch === destinationBranch) {
        next.destinationBranch = "สาขาปลายทางต้องไม่ซ้ำกับต้นทาง";
      }
      if (mode !== "branch_to_branch" && !hotel) next.hotel = "กรุณาเลือกโรงแรม";
      const at = bangkokLocalToIso(scheduled);
      const checkBranch = branchById(mode === "hotel_to_branch" ? destinationBranch : originBranch);
      if (!at) next.scheduled = "กรุณาเลือกวัน-เวลา";
      else if (new Date(at).getTime() < nowMs) next.scheduled = "ต้องไม่ใช่เวลาที่ผ่านมาแล้ว";
      else if (checkBranch && !isWithinOpeningHours(checkBranch, new Date(at))) {
        next.scheduled = `ต้องอยู่ในเวลาเปิด ${formatOpeningHours(checkBranch)}`;
      }
    } else {
      const branch = branchById(storageBranch);
      if (!branch) next.storageBranch = "กรุณาเลือกสาขา";
      const start = bangkokLocalToIso(storageStart);
      const end = bangkokLocalToIso(storageEnd);
      if (!start) next.storageStart = "กรุณาเลือกวัน-เวลาฝาก";
      else if (new Date(start).getTime() < nowMs) next.storageStart = "ต้องไม่ใช่เวลาที่ผ่านมาแล้ว";
      else if (branch && !isWithinOpeningHours(branch, new Date(start))) {
        next.storageStart = `ต้องอยู่ในเวลาเปิด ${formatOpeningHours(branch)}`;
      }
      if (!end) next.storageEnd = "กรุณาเลือกวัน-เวลารับคืน";
      else if (start && new Date(end) <= new Date(start)) next.storageEnd = "ต้องอยู่หลังเวลาฝาก";
      else if (branch && !isWithinOpeningHours(branch, new Date(end))) {
        next.storageEnd = `ต้องอยู่ในเวลาเปิด ${formatOpeningHours(branch)}`;
      }
    }

    if (sender.trim().length < 2) next.sender = "กรุณากรอกชื่อผู้ส่ง";
    if (receiver.trim().length < 2) next.receiver = "กรุณากรอกชื่อผู้รับ";
    if (!isValidThaiPhone(phone)) next.phone = "เบอร์โทรต้องเป็นตัวเลข 10 หลักขึ้นต้นด้วย 0";
    if (totalBags(bags) === 0) next.bags = "กรุณาเลือกกระเป๋าอย่างน้อย 1 ใบ";
    return next;
  }

  function goToSummary() {
    const next = validateDetails();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setDiscount(null);
    setDiscountError(null);
    setSubmitError(null);
    setStep(2);
  }

  async function applyCode() {
    if (!preview || !codeInput.trim()) return;
    setCheckingCode(true);
    setDiscountError(null);
    try {
      const response = await fetch("/api/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeInput, subtotal: preview.price.subtotal }),
      });
      const data = await response.json();
      if (!response.ok) {
        setDiscount(null);
        setDiscountError(data.error ?? "ใช้โค้ดไม่ได้");
      } else {
        setDiscount(data as DiscountResponse);
      }
    } catch {
      setDiscountError("ตรวจสอบโค้ดไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setCheckingCode(false);
    }
  }

  async function submit() {
    if (!service) return;
    setSubmitting(true);
    setSubmitError(null);
    const common = {
      sender_name: sender.trim(),
      receiver_name: receiver.trim(),
      phone: normalizePhone(phone),
      bags,
      discount_code: discount?.code,
    };
    const body: BookingRequest =
      service === "storage"
        ? {
            ...common,
            service_type: "storage",
            branch_id: storageBranch ?? undefined,
            storage_start: bangkokLocalToIso(storageStart) ?? undefined,
            storage_end: bangkokLocalToIso(storageEnd) ?? undefined,
          }
        : {
            ...common,
            service_type: "delivery",
            delivery_mode: mode,
            origin_branch_id: mode !== "hotel_to_branch" ? (originBranch ?? undefined) : undefined,
            destination_branch_id: mode !== "branch_to_hotel" ? (destinationBranch ?? undefined) : undefined,
            hotel: mode !== "branch_to_branch" ? (hotel ?? undefined) : undefined,
            scheduled_at: bangkokLocalToIso(scheduled) ?? undefined,
          };

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        setSubmitError(data.error ?? "สร้างการจองไม่สำเร็จ");
        setSubmitting(false);
        return;
      }
      router.push(`/book/pay/${(data as CreateBookingResponse).tracking_code}`);
    } catch {
      setSubmitError("เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่");
      setSubmitting(false);
    }
  }

  const discountAmount = discount && preview ? Math.min(discount.discount, preview.price.subtotal) : 0;

  return (
    <div className="space-y-6">
      <StepIndicator current={step} />

      {step === 0 ? (
        <section className="grid animate-pop-in gap-4 @2xl:grid-cols-2" aria-label="เลือกบริการ">
          {(
            [
              { value: "delivery", icon: TruckIcon, text: "ส่งกระเป๋าระหว่างสาขาและโรงแรม ติดตามรถได้บนแผนที่" },
              { value: "storage", icon: LuggageIcon, text: "ฝากกระเป๋าไว้ที่สาขา แล้วกลับมารับตามเวลาที่เลือก" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => chooseService(option.value)}
              className={`${cardClass} group cursor-pointer p-6 text-left transition hover:-translate-y-1 hover:border-navy/40 hover:shadow-lg ${
                service === option.value ? "border-navy ring-2 ring-navy/20" : ""
              }`}
            >
              <span className="grid size-12 place-items-center rounded-xl bg-highlight text-2xl text-cta">
                <option.icon />
              </span>
              <p className="mt-4 text-lg font-bold text-navy">{SERVICE_LABELS[option.value]}</p>
              <p className="mt-1 text-sm text-muted">{option.text}</p>
            </button>
          ))}
        </section>
      ) : null}

      {step === 1 && service ? (
        <section className="animate-pop-in space-y-5" aria-label="รายละเอียด">
          <div className={`${cardClass} space-y-5 p-5`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-navy">{SERVICE_LABELS[service]}</h2>
              <button type="button" onClick={() => setStep(0)} className="cursor-pointer text-sm text-muted underline-offset-4 hover:text-navy hover:underline">
                เปลี่ยนบริการ
              </button>
            </div>

            {service === "delivery" ? (
              <>
                <div className="grid gap-2 @lg:grid-cols-3" role="radiogroup" aria-label="รูปแบบการส่ง">
                  {MODES.map((option) => {
                    const [FromIcon, ToIcon] = option.icons;
                    const active = mode === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => {
                          setMode(option.value);
                          setErrors({});
                        }}
                        className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-semibold transition ${
                          active ? "border-navy bg-navy text-white" : "border-line bg-white text-ink hover:border-navy/40"
                        }`}
                      >
                        <FromIcon /> <ArrowRightIcon className="text-xs opacity-70" /> <ToIcon />
                        <span className="ml-1">{DELIVERY_MODE_LABELS[option.value]}</span>
                      </button>
                    );
                  })}
                </div>

                {mode !== "hotel_to_branch" ? (
                  <Field label="สาขาต้นทาง" htmlFor="origin-branch" error={errors.originBranch}>
                    <BranchSelect id="origin-branch" branches={branches} value={originBranch} onChange={setOriginBranch} invalid={!!errors.originBranch} />
                  </Field>
                ) : null}
                {mode !== "branch_to_branch" ? (
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-ink">{mode === "branch_to_hotel" ? "โรงแรมปลายทาง" : "โรงแรมต้นทาง"}</p>
                    <HotelSearch value={hotel} onChange={setHotel} invalid={!!errors.hotel} />
                    {errors.hotel ? <p className="text-xs text-danger">{errors.hotel}</p> : null}
                  </div>
                ) : null}
                {mode !== "branch_to_hotel" ? (
                  <Field label="สาขาปลายทาง" htmlFor="destination-branch" error={errors.destinationBranch}>
                    <BranchSelect
                      id="destination-branch"
                      branches={branches}
                      value={destinationBranch}
                      onChange={setDestinationBranch}
                      exclude={mode === "branch_to_branch" ? originBranch : null}
                      invalid={!!errors.destinationBranch}
                    />
                  </Field>
                ) : null}
                <Field label="วัน-เวลารับกระเป๋า" htmlFor="scheduled" error={errors.scheduled} hint="ต้องอยู่ในเวลาเปิดของสาขา">
                  <input id="scheduled" type="datetime-local" className={inputClass} value={scheduled} min={defaults.scheduled} onChange={(e) => setScheduled(e.target.value)} aria-invalid={!!errors.scheduled} />
                </Field>
              </>
            ) : (
              <>
                <Field label="สาขาที่ฝาก" htmlFor="storage-branch" error={errors.storageBranch}>
                  <BranchSelect id="storage-branch" branches={branches} value={storageBranch} onChange={setStorageBranch} invalid={!!errors.storageBranch} />
                </Field>
                <div className="grid gap-4 @lg:grid-cols-2">
                  <Field label="วัน-เวลาฝาก" htmlFor="storage-start" error={errors.storageStart}>
                    <input id="storage-start" type="datetime-local" className={inputClass} value={storageStart} min={defaults.storageStart} onChange={(e) => setStorageStart(e.target.value)} aria-invalid={!!errors.storageStart} />
                  </Field>
                  <Field label="วัน-เวลารับคืน" htmlFor="storage-end" error={errors.storageEnd}>
                    <input id="storage-end" type="datetime-local" className={inputClass} value={storageEnd} min={storageStart} onChange={(e) => setStorageEnd(e.target.value)} aria-invalid={!!errors.storageEnd} />
                  </Field>
                </div>
                {(() => {
                  const start = bangkokLocalToIso(storageStart);
                  const end = bangkokLocalToIso(storageEnd);
                  const days = start && end ? storageDays(new Date(start), new Date(end)) : 0;
                  return days > 0 ? (
                    <p className="rounded-xl bg-highlight px-4 py-2.5 text-sm text-cta-hover">คิดค่าฝาก {days} วัน (ปัดเศษขึ้นเป็นวัน)</p>
                  ) : null;
                })()}
              </>
            )}
          </div>

          <div className={`${cardClass} space-y-4 p-5`}>
            <h2 className="text-lg font-bold text-navy">ข้อมูลผู้ติดต่อ</h2>
            <div className="grid gap-4 @lg:grid-cols-2">
              <Field label="ชื่อผู้ส่ง" htmlFor="sender" error={errors.sender}>
                <input id="sender" className={inputClass} value={sender} onChange={(e) => setSender(e.target.value)} autoComplete="name" aria-invalid={!!errors.sender} />
              </Field>
              <Field label="ชื่อผู้รับ" htmlFor="receiver" error={errors.receiver}>
                <input id="receiver" className={inputClass} value={receiver} onChange={(e) => setReceiver(e.target.value)} aria-invalid={!!errors.receiver} />
              </Field>
            </div>
            <Field label="เบอร์โทรศัพท์" htmlFor="phone" error={errors.phone} hint="ตัวเลข 10 หลัก ขึ้นต้นด้วย 0">
              <input id="phone" type="tel" inputMode="numeric" maxLength={12} className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812345678" autoComplete="tel" aria-invalid={!!errors.phone} />
            </Field>
          </div>

          <div className={`${cardClass} space-y-3 p-5`}>
            <h2 className="text-lg font-bold text-navy">จำนวนกระเป๋า</h2>
            <BagCounter service={service} value={bags} onChange={setBags} />
            {errors.bags ? <p className="text-xs text-danger">{errors.bags}</p> : null}
          </div>

          <div className="flex justify-between gap-3">
            <button type="button" onClick={() => setStep(0)} className={buttonClass("secondary")}>
              <ArrowLeftIcon /> ย้อนกลับ
            </button>
            <button type="button" onClick={goToSummary} className={buttonClass("primary")}>
              ดูสรุปราคา <ArrowRightIcon />
            </button>
          </div>
        </section>
      ) : null}

      {step === 2 && service && preview ? (
        <section className="animate-pop-in space-y-5" aria-label="สรุปราคา">
          <div className={`${cardClass} space-y-3 p-5 text-sm`}>
            <h2 className="text-lg font-bold text-navy">สรุปการจอง</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              <dt className="text-muted">บริการ</dt>
              <dd className="font-medium">
                {SERVICE_LABELS[service]}
                {service === "delivery" ? ` · ${DELIVERY_MODE_LABELS[mode]}` : ""}
              </dd>
              {service === "delivery" ? (
                <>
                  <dt className="text-muted">ต้นทาง</dt>
                  <dd className="font-medium">{endpoints.from?.name}</dd>
                  <dt className="text-muted">ปลายทาง</dt>
                  <dd className="font-medium">{endpoints.to?.name}</dd>
                  <dt className="text-muted">รับกระเป๋า</dt>
                  <dd className="font-medium">{formatDateTime(bangkokLocalToIso(scheduled) ?? defaults.now)}</dd>
                </>
              ) : (
                <>
                  <dt className="text-muted">สาขา</dt>
                  <dd className="font-medium">{branchById(storageBranch)?.name}</dd>
                  <dt className="text-muted">ฝาก</dt>
                  <dd className="font-medium">{formatDateTime(bangkokLocalToIso(storageStart) ?? defaults.now)}</dd>
                  <dt className="text-muted">รับคืน</dt>
                  <dd className="font-medium">{formatDateTime(bangkokLocalToIso(storageEnd) ?? defaults.now)}</dd>
                </>
              )}
              <dt className="text-muted">ผู้ส่ง / ผู้รับ</dt>
              <dd className="font-medium">
                {sender} / {receiver}
              </dd>
              <dt className="text-muted">เบอร์โทร</dt>
              <dd className="font-medium">{normalizePhone(phone)}</dd>
            </dl>
          </div>

          <PriceSummary
            lines={preview.price.lines}
            subtotal={preview.price.subtotal}
            discount={discountAmount}
            total={preview.price.subtotal - discountAmount}
            discountCode={discount?.code}
            note={
              preview.estimatedKm != null
                ? "ค่าระยะทางเป็นราคาประมาณ ระบบจะคำนวณจากเส้นทางจริง (OSRM) เมื่อยืนยันการจอง"
                : undefined
            }
          />

          <div className={`${cardClass} space-y-2 p-5`}>
            <label htmlFor="discount" className="flex items-center gap-2 text-sm font-medium text-ink">
              <TagIcon /> โค้ดส่วนลด
            </label>
            <div className="flex gap-2">
              <input
                id="discount"
                className={`${inputClass} uppercase`}
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value);
                  setDiscount(null);
                  setDiscountError(null);
                }}
                placeholder="WELCOME10"
                aria-invalid={!!discountError}
              />
              <button type="button" onClick={applyCode} disabled={checkingCode || !codeInput.trim()} className={buttonClass("secondary", "md", "shrink-0")}>
                {checkingCode ? <Spinner /> : null} ใช้โค้ด
              </button>
            </div>
            {discountError ? <p className="text-xs text-danger">{discountError}</p> : null}
            {discount ? (
              <p className="text-xs text-success">
                ใช้โค้ด {discount.code} แล้ว ({discount.description})
              </p>
            ) : null}
          </div>

          {submitError ? (
            <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
              {submitError}
            </p>
          ) : null}

          <div className="flex justify-between gap-3">
            <button type="button" onClick={() => setStep(1)} className={buttonClass("secondary")} disabled={submitting}>
              <ArrowLeftIcon /> แก้ไข
            </button>
            <button type="button" onClick={submit} className={buttonClass("primary")} disabled={submitting}>
              {submitting ? <Spinner /> : null} ยืนยันและไปชำระเงิน
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
