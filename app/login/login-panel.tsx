"use client";

import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";

export function LoginPanel({ next }: { next: string }) {
  const router = useRouter();
  return (
    <AuthForm
      next={next}
      onSuccess={() => {
        router.replace(next);
        router.refresh();
      }}
    />
  );
}
