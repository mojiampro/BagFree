import type { Metadata } from "next";
import { BookingWizard, type WizardDefaults } from "@/components/booking/booking-wizard";
import { EmptyState, ErrorState } from "@/components/ui";
import { getBranches } from "@/lib/data";
import { bangkokMinutesOfDay, toBangkokLocalInput } from "@/lib/time";
import type { ServiceType } from "@/lib/types";

export const metadata: Metadata = { title: "จองบริการ" };

const HOUR_MS = 60 * 60 * 1000;

/** Next whole hour at least one hour ahead, nudged into 09:00–20:00 Bangkok time so most branches are open. */
function suggestedStart(now: Date) {
  const start = new Date(Math.ceil((now.getTime() + HOUR_MS) / HOUR_MS) * HOUR_MS);
  const minutes = bangkokMinutesOfDay(start);
  if (minutes < 9 * 60) return new Date(start.getTime() + (9 * 60 - minutes) * 60 * 1000);
  if (minutes > 20 * 60) return new Date(start.getTime() + (24 * 60 - minutes + 9 * 60) * 60 * 1000);
  return start;
}

export default async function BookPage({ searchParams }: PageProps<"/book">) {
  const { service, branch, promo } = await searchParams;
  const initialService: ServiceType | null = service === "delivery" || service === "storage" ? service : null;
  const { data: branches, error } = await getBranches();

  const now = new Date();
  const start = suggestedStart(now);
  const defaults: WizardDefaults = {
    now: now.toISOString(),
    scheduled: toBangkokLocalInput(start),
    storageStart: toBangkokLocalInput(start),
    storageEnd: toBangkokLocalInput(new Date(start.getTime() + 24 * HOUR_MS)),
  };

  return (
    <div className="bg-alt px-4 py-8 @2xl:py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-navy">จองบริการ Bag Free</h1>
        {!branches ? (
          <ErrorState title="โหลดข้อมูลสาขาไม่สำเร็จ" message={error ?? ""} />
        ) : branches.length === 0 ? (
          <EmptyState title="ยังไม่มีสาขาให้บริการ" message="รัน supabase/seed.sql เพื่อเพิ่มข้อมูลสาขา" />
        ) : (
          <BookingWizard
            branches={branches}
            initialService={initialService}
            initialBranchId={branches.find((b) => String(b.id) === branch)?.id ?? null}
            initialPromo={typeof promo === "string" ? promo.toUpperCase().slice(0, 20) : ""}
            defaults={defaults}
          />
        )}
      </div>
    </div>
  );
}
