import { ClockIcon, MapPinIcon, PhoneIcon, TrainIcon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { EmptyState, ErrorState, SectionHeading, Skeleton } from "@/components/ui";
import { getBranches } from "@/lib/data";
import { formatOpeningHours, isWithinOpeningHours } from "@/lib/time";

function BranchSection({ children }: { children: React.ReactNode }) {
  return (
    <section id="branches" className="bg-alt px-4 py-16 @2xl:py-20">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeading
            eyebrow="สาขา"
            title="จุดบริการใกล้สถานีรถไฟฟ้าและสนามบิน"
            description="แวะฝากหรือรับกระเป๋าได้ที่ทุกสาขา ระหว่างเวลาทำการ"
          />
        </Reveal>
        {children}
      </div>
    </section>
  );
}

export async function BranchDirectory() {
  const { data: branches, error } = await getBranches();
  const now = new Date();

  return (
    <BranchSection>
      {!branches ? (
        <ErrorState title="โหลดรายชื่อสาขาไม่สำเร็จ" message={error ?? ""} />
      ) : branches.length === 0 ? (
        <EmptyState icon={<MapPinIcon />} title="ยังไม่มีสาขา" message="รัน supabase/seed.sql เพื่อเพิ่มข้อมูลสาขา" />
      ) : (
        <div className="grid gap-4 @2xl:grid-cols-2 @4xl:grid-cols-3">
          {branches.map((branch, index) => {
            const open = isWithinOpeningHours(branch, now);
            return (
              <Reveal key={branch.id} delay={(index % 3) * 80}>
                <article className="h-full rounded-2xl border border-line bg-card p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-navy-soft text-navy">
                        <TrainIcon />
                      </span>
                      <h3 className="font-bold text-navy">{branch.name}</h3>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        open ? "bg-success-soft text-success" : "bg-alt text-muted"
                      }`}
                    >
                      {open ? "เปิดอยู่" : "ปิดแล้ว"}
                    </span>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-muted">
                    <li className="flex items-center gap-2">
                      <ClockIcon /> {formatOpeningHours(branch)}
                    </li>
                    <li className="flex items-center gap-2">
                      <PhoneIcon />
                      <a href={`tel:${branch.phone.replace(/-/g, "")}`} className="transition hover:text-navy">
                        {branch.phone}
                      </a>
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPinIcon />
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${branch.lat}&mlon=${branch.lng}#map=17/${branch.lat}/${branch.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="transition hover:text-navy"
                      >
                        ดูแผนที่
                      </a>
                    </li>
                  </ul>
                </article>
              </Reveal>
            );
          })}
        </div>
      )}
    </BranchSection>
  );
}

export function BranchDirectorySkeleton() {
  return (
    <BranchSection>
      <div className="grid gap-4 @2xl:grid-cols-2 @4xl:grid-cols-3" aria-label="กำลังโหลดสาขา">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    </BranchSection>
  );
}
