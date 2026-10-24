import { AuthLink } from "@/components/auth/auth-link";
import { CheckIcon, LuggageIcon, MapPinIcon, TruckIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui";

const HIGHLIGHTS = ["6 สาขาใกล้รถไฟฟ้า", "ติดตามรถแบบเรียลไทม์", "เริ่มต้น 50 ฿/วัน"];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy to-navy-dark text-white">
      <div className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-cta/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-white/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 @4xl:grid-cols-2 @4xl:py-24">
        <div className="animate-pop-in">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
            <span className="size-2 rounded-full bg-cta" /> บริการกระเป๋าสำหรับนักท่องเที่ยวในกรุงเทพฯ
          </p>
          <h1 className="text-3xl leading-tight font-bold @2xl:text-5xl">
            เที่ยวต่อได้ทันที
            <br />
            <span className="text-cta">ไม่ต้องแบกกระเป๋า</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/80 @2xl:text-lg">
            ฝากกระเป๋าที่สถานีรถไฟฟ้า หรือให้เราส่งต่อไปยังโรงแรมและสาขาปลายทาง พร้อมติดตามเส้นทางบนแผนที่ได้ตลอดเวลา
          </p>
          <div className="mt-8 flex flex-col gap-3 @md:flex-row">
            <AuthLink href="/book?service=delivery" className={buttonClass("primary", "lg")}>
              <TruckIcon /> ส่งเลย
            </AuthLink>
            <AuthLink href="/book?service=storage" className={buttonClass("secondary", "lg")}>
              <LuggageIcon /> ฝากกระเป๋าเลย
            </AuthLink>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckIcon className="text-cta" /> {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-sm animate-slide-in">
          <div className="rounded-3xl bg-white p-5 text-ink shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">Tracking Code</p>
              <span className="rounded-full bg-navy-soft px-2.5 py-1 text-xs font-semibold text-navy">กำลังจัดส่ง</span>
            </div>
            <p className="mt-1 font-mono text-xl font-bold text-navy">BF-7K2M9Q</p>
            <div className="mt-5 space-y-4">
              <div className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-navy text-white">
                  <MapPinIcon />
                </span>
                <div>
                  <p className="text-xs text-muted">ต้นทาง</p>
                  <p className="text-sm font-semibold">BTS สยาม</p>
                </div>
              </div>
              <div className="ml-4 h-6 border-l-2 border-dashed border-line" />
              <div className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cta text-white">
                  <MapPinIcon />
                </span>
                <div>
                  <p className="text-xs text-muted">ปลายทาง</p>
                  <p className="text-sm font-semibold">โรงแรมย่านสุขุมวิท</p>
                </div>
              </div>
            </div>
            <div className="mt-5">
              <div className="h-2 overflow-hidden rounded-full bg-alt">
                <div className="h-full w-2/3 rounded-full bg-cta" />
              </div>
              <p className="mt-2 text-xs text-muted">ถึงปลายทางในอีกประมาณ 12 นาที</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
