"use client";

import { useState, type FormEvent } from "react";
import { ensureDemoUser } from "@/app/actions/auth";
import { Spinner } from "@/components/icons";
import { buttonClass, Field, inputClass } from "@/components/ui";
import { DEMO_ACCOUNT } from "@/lib/demo";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "register";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  email_not_confirmed: "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ",
  user_already_exists: "อีเมลนี้มีบัญชีอยู่แล้ว",
  email_exists: "อีเมลนี้มีบัญชีอยู่แล้ว",
  weak_password: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
  over_request_rate_limit: "ส่งคำขอบ่อยเกินไป กรุณาลองใหม่ภายหลัง",
};

function toThaiError(error: { code?: string; message: string }) {
  return (error.code && ERROR_MESSAGES[error.code]) || error.message;
}

export function AuthForm({ next, onSuccess }: { next: string; onSuccess: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"form" | "demo" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const configured = hasSupabaseEnv();

  function switchMode(value: Mode) {
    setMode(value);
    setError(null);
    setInfo(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (mode === "register" && fullName.trim().length < 2) {
      setError("กรุณากรอกชื่อ-นามสกุล");
      return;
    }
    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setBusy("form");
    const supabase = createClient();
    if (mode === "login") {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(null);
      if (signInError) return setError(toThaiError(signInError));
      onSuccess();
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setBusy(null);
    if (signUpError) return setError(toThaiError(signUpError));
    if (data.session) {
      onSuccess();
    } else {
      setInfo("สมัครสมาชิกสำเร็จ! กรุณายืนยันอีเมลจากกล่องจดหมายของคุณ แล้วกลับมาเข้าสู่ระบบ");
      setMode("login");
    }
  }

  async function handleDemoLogin() {
    setError(null);
    setInfo(null);
    setBusy("demo");
    const supabase = createClient();
    const credentials = { email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password };

    let { error: signInError } = await supabase.auth.signInWithPassword(credentials);
    if (signInError?.code === "invalid_credentials") {
      const created = await ensureDemoUser();
      if (!created.ok) {
        setBusy(null);
        setError(created.error);
        return;
      }
      ({ error: signInError } = await supabase.auth.signInWithPassword(credentials));
    }
    setBusy(null);
    if (signInError) return setError(toThaiError(signInError));
    onSuccess();
  }

  if (!configured) {
    return (
      <p className="rounded-xl bg-danger-soft p-4 text-sm text-danger">
        ยังไม่ได้ตั้งค่า Supabase — คัดลอก <code>.env.example</code> เป็น <code>.env.local</code> แล้วใส่คีย์ของโปรเจกต์
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 rounded-xl bg-alt p-1" role="tablist" aria-label="เลือกรูปแบบ">
        {(["login", "register"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => switchMode(value)}
            className={`h-10 cursor-pointer rounded-lg text-sm font-semibold transition ${
              mode === value ? "bg-white text-navy shadow-sm" : "text-muted hover:text-navy"
            }`}
          >
            {value === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {mode === "register" ? (
          <Field label="ชื่อ-นามสกุล" htmlFor="auth-name">
            <input
              id="auth-name"
              className={inputClass}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              placeholder="สมชาย ใจดี"
            />
          </Field>
        ) : null}
        <Field label="อีเมล" htmlFor="auth-email">
          <input
            id="auth-email"
            type="email"
            required
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
          />
        </Field>
        <Field label="รหัสผ่าน" htmlFor="auth-password" hint={mode === "register" ? "อย่างน้อย 6 ตัวอักษร" : undefined}>
          <input
            id="auth-password"
            type="password"
            required
            minLength={6}
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </Field>

        {error ? (
          <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        {info ? (
          <p className="rounded-xl bg-success-soft px-4 py-3 text-sm text-success" role="status">
            {info}
          </p>
        ) : null}

        <button type="submit" className={buttonClass("primary", "md", "w-full")} disabled={busy !== null}>
          {busy === "form" ? <Spinner /> : null}
          {mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        หรือ
        <span className="h-px flex-1 bg-line" />
      </div>

      <button
        type="button"
        onClick={handleDemoLogin}
        disabled={busy !== null}
        className={buttonClass("secondary", "md", "w-full")}
      >
        {busy === "demo" ? <Spinner /> : null}
        Demo Login
      </button>
      <p className="text-center text-xs text-muted">
        บัญชีทดลอง: {DEMO_ACCOUNT.email} / {DEMO_ACCOUNT.password}
      </p>
    </div>
  );
}
