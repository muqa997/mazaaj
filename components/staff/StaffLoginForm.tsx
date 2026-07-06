"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function StaffLoginForm({
  loginAction,
}: {
  loginAction: (code: string) => Promise<{ success: boolean }>;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const result = await loginAction(code);

    if (result.success) {
      router.refresh();
    } else {
      setError(true);
      setCode("");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/5">
        <Lock size={24} className="text-accent" />
      </div>
      <h1 className="mb-2 text-xl font-extrabold text-primary">صفحة الطلبات</h1>
      <p className="mb-8 text-sm text-primary/50">أدخل رمز الدخول للمتابعة</p>

      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-4">
        <input
          type="password"
          maxLength={32}
          required
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full rounded-xl border border-primary/15 bg-background px-4 py-3 text-center text-xl tracking-[0.3em] text-primary outline-none focus:border-accent"
          placeholder="••••••"
        />
        {error && <p className="text-center text-sm text-red-500">رمز غير صحيح</p>}
        <button
          type="submit"
          disabled={loading || code.length === 0}
          className="rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-background transition-opacity disabled:opacity-50"
        >
          {loading ? "جاري التحقق..." : "دخول"}
        </button>
      </form>
    </div>
  );
}
