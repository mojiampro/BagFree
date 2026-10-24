import { CheckIcon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/ui";

type Stage = "done" | "next" | "future";

const MILESTONES: { phase: string; title: string; items: string[]; stage: Stage }[] = [
  {
    phase: "Phase 1",
    title: "รากฐานระบบ",
    items: ["ระบบสมาชิก + Demo Login", "Landing Page และรายชื่อสาขา", "ฐานข้อมูล Supabase + RLS"],
    stage: "done",
  },
  {
    phase: "Phase 2",
    title: "จองและชำระเงิน",
    items: ["จองส่ง/ฝากแบบทีละขั้นตอน", "ค้นหาโรงแรม + คำนวณเส้นทาง", "Stripe: บัตร, PromptPay, เงินสด"],
    stage: "done",
  },
  {
    phase: "Phase 3",
    title: "ติดตามและรับคืน",
    items: ["แผนที่ติดตามรถแบบเรียลไทม์", "Live Driver Mode", "QR Code สำหรับรับคืน"],
    stage: "done",
  },
  {
    phase: "Phase 4",
    title: "แดชบอร์ดและรีวิว",
    items: ["แจ้งเตือนสถานะแบบ Realtime", "ประวัติการจอง", "รีวิวครึ่งดาวได้"],
    stage: "done",
  },
  {
    phase: "อนาคต",
    title: "ต่อยอดบริการ",
    items: ["แจ้งเตือนผ่าน LINE", "รองรับภาษาอังกฤษ/จีน", "แอปสำหรับพนักงานขับรถจริง"],
    stage: "future",
  },
];

const STAGE_STYLES: Record<Stage, { dot: string; badge: string; label: string }> = {
  done: { dot: "bg-success text-white", badge: "bg-success-soft text-success", label: "เสร็จแล้ว" },
  next: { dot: "bg-cta text-white", badge: "bg-highlight text-cta-hover", label: "กำลังพัฒนา" },
  future: { dot: "bg-line text-muted", badge: "bg-alt text-muted", label: "แผนอนาคต" },
};

export function Roadmap() {
  return (
    <section id="roadmap" className="bg-page px-4 py-16 @2xl:py-20">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <SectionHeading eyebrow="Project Roadmap" title="เส้นทางการพัฒนาโปรเจกต์" />
        </Reveal>
        <ol className="relative space-y-6 border-l-2 border-line pl-8">
          {MILESTONES.map((milestone, index) => {
            const style = STAGE_STYLES[milestone.stage];
            return (
              <li key={milestone.phase} className="relative">
                <span
                  className={`absolute top-1 -left-[2.6rem] grid size-8 place-items-center rounded-full text-sm font-bold ring-4 ring-page ${style.dot}`}
                >
                  {milestone.stage === "done" ? <CheckIcon /> : index + 1}
                </span>
                <Reveal direction="right" delay={index * 60}>
                  <div className="rounded-2xl border border-line bg-card p-5 shadow-sm transition hover:shadow-md">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-muted">{milestone.phase}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${style.badge}`}>
                        {style.label}
                      </span>
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-navy">{milestone.title}</h3>
                    <ul className="mt-2 space-y-1 text-sm text-muted">
                      {milestone.items.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
