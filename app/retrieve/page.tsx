import type { Metadata } from "next";
import { RetrievalLookup } from "@/app/retrieve/retrieval-lookup";

export const metadata: Metadata = { title: "รับคืนกระเป๋า" };

export default async function RetrievePage({ searchParams }: PageProps<"/retrieve">) {
  const { code } = await searchParams;
  const initialCode = typeof code === "string" ? code.toUpperCase().slice(0, 12) : "";

  return (
    <div className="bg-alt px-4 py-8 @2xl:py-12">
      <div className="mx-auto max-w-xl space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-navy">รับคืนกระเป๋า</h1>
          <p className="mt-1 text-sm text-muted">ค้นหาด้วย Tracking Code (BF-XXXXXX) หรือ Seal Code 6 หลัก แล้วแสดง QR Code ให้เจ้าหน้าที่</p>
        </div>
        <RetrievalLookup initialCode={initialCode} />
      </div>
    </div>
  );
}
