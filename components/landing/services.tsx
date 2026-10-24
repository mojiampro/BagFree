import { AuthLink } from "@/components/auth/auth-link";
import { ArrowRightIcon, KeyIcon, LuggageIcon, TruckIcon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/ui";

const SERVICES = [
  {
    href: "/book?service=delivery",
    icon: TruckIcon,
    title: "ส่งกระเป๋า",
    description: "ส่งจากสาขาไปโรงแรม จากโรงแรมมาสาขา หรือระหว่างสาขา ติดตามรถได้บนแผนที่",
    price: "เริ่มต้น 150 ฿",
  },
  {
    href: "/book?service=storage",
    icon: LuggageIcon,
    title: "ฝากกระเป๋า",
    description: "ฝากไว้ที่สาขาใกล้สถานี ปิดผนึกด้วย Seal Code พร้อมช่องเก็บเฉพาะของคุณ",
    price: "เริ่มต้น 50 ฿/วัน",
  },
  {
    href: "/retrieve",
    icon: KeyIcon,
    title: "รับคืนกระเป๋า",
    description: "ค้นหาด้วย Tracking Code หรือ Seal Code แล้วแสดง QR Code ให้เจ้าหน้าที่สแกน",
    price: "ไม่มีค่าใช้จ่าย",
  },
];

export function Services() {
  return (
    <section id="services" className="bg-page px-4 py-16 @2xl:py-20">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeading
            eyebrow="บริการของเรา"
            title="เลือกบริการที่เหมาะกับทริปของคุณ"
            description="จองออนไลน์ได้ในไม่กี่ขั้นตอน ชำระผ่านบัตร PromptPay หรือเงินสดที่เคาน์เตอร์"
          />
        </Reveal>
        <div className="grid gap-5 @2xl:grid-cols-3">
          {SERVICES.map((service, index) => (
            <Reveal key={service.title} delay={index * 100}>
              <AuthLink
                href={service.href}
                className="group flex h-full w-full cursor-pointer flex-col rounded-2xl border border-line bg-card p-6 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-navy/30 hover:shadow-xl"
              >
                <span className="grid size-14 place-items-center rounded-2xl bg-highlight text-3xl text-cta transition group-hover:scale-110">
                  <service.icon />
                </span>
                <span className="mt-5 text-xl font-bold text-navy">{service.title}</span>
                <span className="mt-2 flex-1 text-sm leading-relaxed text-muted">{service.description}</span>
                <span className="mt-5 flex items-center justify-between border-t border-line pt-4">
                  <span className="text-sm font-semibold text-ink">{service.price}</span>
                  <ArrowRightIcon className="text-navy transition group-hover:translate-x-1" />
                </span>
              </AuthLink>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
