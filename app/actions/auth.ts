"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { DEMO_ACCOUNT } from "@/lib/demo";

/** Creates the shared demo account (already confirmed) if it does not exist yet. */
export async function ensureDemoUser(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.createUser({
      email: DEMO_ACCOUNT.email,
      password: DEMO_ACCOUNT.password,
      email_confirm: true,
      user_metadata: { full_name: DEMO_ACCOUNT.fullName },
    });
    if (error && error.code !== "email_exists" && error.status !== 422) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "สร้างบัญชีทดลองไม่สำเร็จ" };
  }
}
