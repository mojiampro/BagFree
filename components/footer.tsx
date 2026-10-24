import Link from "next/link";
import { LuggageIcon, MapPinIcon, PhoneIcon } from "@/components/icons";

export function Footer() {
  return (
    <footer className="mt-auto bg-navy text-white/80">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 @2xl:grid-cols-3">
        <div>
          <p className="flex items-center gap-2 text-lg font-bold text-white">
            <span className="grid size-8 place-items-center rounded-lg bg-cta">
              <LuggageIcon />
            </span>
            Bag Free
          </p>
          <p className="mt-3 text-sm leading-relaxed">
            ฝากและส่งกระเป๋าเดินทางระหว่างสถานีรถไฟฟ้า สาขา และโรงแรมทั่วกรุงเทพฯ เที่ยวต่อได้ทันทีโดยไม่ต้องแบกสัมภาระ
          </p>
        </div>
        <div>
          <p className="mb-3 font-semibold text-white">เมนู</p>
          <ul className="space-y-2 text-sm">
            <li><Link className="transition hover:text-white" href="/#services">บริการ</Link></li>
            <li><Link className="transition hover:text-white" href="/#branches">สาขา</Link></li>
            <li><Link className="transition hover:text-white" href="/dashboard">การจองของฉัน</Link></li>
            <li><Link className="transition hover:text-white" href="/retrieve">รับคืนกระเป๋า</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 font-semibold text-white">ติดต่อ</p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><PhoneIcon /> 02-000-0000</li>
            <li className="flex items-center gap-2"><MapPinIcon /> 6 สาขาทั่วกรุงเทพฯ</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-white/60">
          © {new Date().getFullYear()} Bag Free — โปรเจกต์ในรายวิชา ข้อมูลสาขาและบริการเป็นข้อมูลสมมติ
        </p>
      </div>
    </footer>
  );
}
