"use client";

import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Modal } from "@/components/modal";
import { NotificationsProvider } from "@/components/providers/notifications-provider";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** Navigate to `href`, or ask the visitor to sign in first and continue there afterwards. */
  requireAuth: (href: string) => void;
  openLogin: (next?: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(hasSupabaseEnv);
  const [loginNext, setLoginNext] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseEnv()) return;
    const supabase = createClient();
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const openLogin = useCallback((next?: string) => {
    setLoginNext(next ?? window.location.pathname + window.location.search);
  }, []);

  const requireAuth = useCallback(
    (href: string) => {
      if (user) router.push(href);
      else setLoginNext(href);
    },
    [user, router],
  );

  const signOut = useCallback(async () => {
    await createClient().auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  }, [router]);

  const closeLogin = useCallback(() => setLoginNext(null), []);

  const handleSuccess = useCallback(() => {
    const destination = loginNext ?? "/";
    setLoginNext(null);
    router.push(destination);
    router.refresh();
  }, [loginNext, router]);

  const value = useMemo(
    () => ({ user, loading, requireAuth, openLogin, signOut }),
    [user, loading, requireAuth, openLogin, signOut],
  );

  return (
    <AuthContext value={value}>
      <NotificationsProvider user={user}>
        {children}
      </NotificationsProvider>
      <Modal
        open={loginNext !== null}
        onClose={closeLogin}
        title="เข้าสู่ระบบก่อนใช้งาน"
        description="เข้าสู่ระบบเพื่อจอง ส่ง หรือรับคืนกระเป๋า แล้วเราจะพาคุณกลับไปหน้าที่ต้องการ"
      >
        <AuthForm next={loginNext ?? "/"} onSuccess={handleSuccess} />
      </Modal>
    </AuthContext>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
