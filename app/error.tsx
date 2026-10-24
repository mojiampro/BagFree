"use client";

import { ErrorState, buttonClass } from "@/components/ui";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const message = error instanceof Error && error.message ? error.message : "ไม่สามารถแสดงหน้านี้ได้ กรุณาลองใหม่อีกครั้ง";
  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-4 py-16">
      <ErrorState
        title="มีบางอย่างผิดพลาด"
        message={message}
        action={
          <button type="button" onClick={() => retry()} className={buttonClass("secondary", "sm")}>
            ลองใหม่
          </button>
        }
      />
    </div>
  );
}
