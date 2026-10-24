import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginPanel } from "@/app/login/login-panel";
import { hasSupabaseEnv } from "@/lib/env";
import { safeNextPath } from "@/lib/safe-redirect";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const destination = safeNextPath(typeof next === "string" ? next : null);

  if (hasSupabaseEnv() && (await getCurrentUser())) redirect(destination);

  return (
    <div className="flex flex-1 items-center justify-center bg-alt px-4 py-12">
      <div className="w-full max-w-md animate-pop-in rounded-3xl border border-line bg-card p-6 shadow-xl @md:p-8">
        <h1 className="text-2xl font-bold text-navy">เข้าสู่ระบบ</h1>
        <p className="mt-1 mb-6 text-sm text-muted">เข้าสู่ระบบเพื่อจอง ส่ง หรือรับคืนกระเป๋า</p>
        <LoginPanel next={destination} />
      </div>
    </div>
  );
}
