import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/ui";
import {
  BAG_SIZES,
  DELIVERY_BASE_PRICE,
  DELIVERY_PRICE_PER_KM,
  SIZE_LABELS,
  STORAGE_PRICE_PER_DAY,
} from "@/lib/pricing";

export function Pricing() {
  return (
    <section id="pricing" className="bg-page px-4 py-16 @2xl:py-20">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <SectionHeading eyebrow="ราคา" title="ราคาชัดเจน ไม่มีค่าใช้จ่ายแอบแฝง" />
        </Reveal>
        <Reveal>
          <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-navy text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">ขนาด</th>
                  <th className="px-4 py-3 text-right font-semibold">ฝาก / วัน</th>
                  <th className="px-4 py-3 text-right font-semibold">ส่ง (เริ่มต้น)</th>
                </tr>
              </thead>
              <tbody>
                {BAG_SIZES.map((size) => (
                  <tr key={size} className="border-t border-line transition hover:bg-highlight">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{SIZE_LABELS[size].name}</p>
                      <p className="text-xs text-muted">{SIZE_LABELS[size].hint}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{STORAGE_PRICE_PER_DAY[size]} ฿</td>
                    <td className="px-4 py-3 text-right font-semibold">{DELIVERY_BASE_PRICE[size]} ฿</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
        <Reveal>
          <ul className="mt-5 space-y-1.5 text-sm text-muted">
            <li>• ส่งกระเป๋า: บวกค่าระยะทาง {DELIVERY_PRICE_PER_KM} ฿/กม. ต่อการจอง (คำนวณจากเส้นทางจริง)</li>
            <li>• ฝากกระเป๋า: คิดเป็นวัน ปัดเศษขึ้น (25 ชั่วโมง = 2 วัน)</li>
            <li>• โค้ดส่วนลด: WELCOME10 · BAGFREE50 · KMITL20</li>
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
