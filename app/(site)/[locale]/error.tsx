"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <p className="mb-6 text-primary/60">حدث خطأ غير متوقع، حاول مرة أخرى.</p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-background"
        >
          إعادة المحاولة
        </button>
        <Link
          href="/"
          className="rounded-full border border-primary/15 px-6 py-3 text-sm font-semibold text-primary"
        >
          الرئيسية
        </Link>
      </div>
    </div>
  );
}
