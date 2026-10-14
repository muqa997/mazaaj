"use client";

import { useEffect, useRef, useState } from "react";
import { Delete, KeyRound } from "lucide-react";

type DrawGateProps = {
  verifyCode: (code: string) => Promise<{ ok: boolean }>;
  onUnlock: () => void;
};

const CODE_LENGTH = 4;

/**
 * قفل بسيط أمام شاشة القرعة.
 *
 * الرمز يُتحقَّق منه **بالخادم** لا بالمتصفح: لو قُورن بالواجهة لظهر داخل ملفات
 * الصفحة لأي شخص يفتح أدوات المطوّر. وهو ليس حاجزاً أمنياً أصلاً — المدير داخلٌ
 * للوحة بجلسته أساساً — بل ستارة تمنع ظهور بيانات اللوحة على شاشة الكافيه.
 */
export default function DrawGate({ verifyCode, onUnlock }: DrawGateProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (code.length !== CODE_LENGTH || submittedRef.current) return;
    submittedRef.current = true;
    setBusy(true);

    verifyCode(code)
      .then(({ ok }) => {
        if (ok) {
          onUnlock();
          return;
        }
        setError(true);
        setCode("");
        navigator.vibrate?.(180);
      })
      .catch(() => {
        setError(true);
        setCode("");
      })
      .finally(() => {
        setBusy(false);
        submittedRef.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const press = (digit: string) => {
    if (busy) return;
    setError(false);
    setCode((prev) => (prev.length >= CODE_LENGTH ? prev : prev + digit));
  };

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col items-center py-10">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/5">
        <KeyRound size={22} className="text-primary/50" />
      </span>

      <h2 className="text-lg font-black text-primary">شاشة القرعة</h2>
      <p className="mt-1.5 text-center text-xs text-primary/45">
        أدخل الرمز لفتح شاشة العرض
      </p>

      {/* النقاط: لا يظهر أي رقم على الشاشة أثناء الإدخال */}
      <div className="my-7 flex gap-3.5" aria-label="الرمز" aria-live="polite">
        {Array.from({ length: CODE_LENGTH }, (_, i) => (
          <span
            key={i}
            className={`h-3.5 w-3.5 rounded-full transition-colors ${
              error
                ? "bg-red-400"
                : i < code.length
                  ? "bg-primary"
                  : "bg-primary/15"
            }`}
          />
        ))}
      </div>

      {error && <p className="mb-4 text-xs font-bold text-red-600">رمز غير صحيح</p>}

      <div className="grid w-full grid-cols-3 gap-2.5">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => press(d)}
            className="flex h-16 items-center justify-center rounded-2xl bg-primary/5 text-xl font-black text-primary active:bg-primary/10"
          >
            {d}
          </button>
        ))}
        <span />
        <button
          type="button"
          onClick={() => press("0")}
          className="flex h-16 items-center justify-center rounded-2xl bg-primary/5 text-xl font-black text-primary active:bg-primary/10"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => {
            setError(false);
            setCode((prev) => prev.slice(0, -1));
          }}
          aria-label="مسح"
          className="flex h-16 items-center justify-center rounded-2xl bg-primary/5 text-primary/60 active:bg-primary/10"
        >
          <Delete size={20} />
        </button>
      </div>
    </div>
  );
}
