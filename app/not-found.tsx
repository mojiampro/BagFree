import Link from "next/link";
import { LuggageIcon } from "@/components/icons";
import { EmptyState, buttonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-4 py-16">
      <EmptyState
        icon={<LuggageIcon />}
        title="ไม่พบหน้าที่คุณต้องการ"
        message="ลิงก์อาจไม่ถูกต้อง หรือข้อมูลนี้ไม่ใช่ของบัญชีคุณ"
        action={
          <Link href="/" className={buttonClass("secondary", "sm")}>
            กลับหน้าแรก
          </Link>
        }
      />
    </div>
  );
}
