"use client";

import { useState } from "react";
import { Wifi, Copy, Check } from "lucide-react";

type WifiCardProps = {
  ssid: string;
  password: string;
  qrDataUrl: string;
};

export default function WifiCard({ ssid, password, qrDataUrl }: WifiCardProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // بعض المتصفحات تمنع النسخ التلقائي بدون تفاعل مباشر — كلمة المرور معروضة
      // كنص أصلاً فيبقى بإمكان الزبون نسخها يدوياً حتى لو فشل هذا الزر
    }
  };

  return (
    <div className="flex flex-col rounded-3xl border border-accent/25 bg-accent/10 p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex flex-col items-center gap-2 text-center"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/20">
          <Wifi size={20} className="text-accent" />
        </span>
        <span className="text-sm font-extrabold text-primary">واي فاي مجاني</span>
        <span className="text-[11px] text-primary/50">أزوّدك برمز المرور</span>
      </button>

      {open && (
        <div className="mt-4 flex flex-col items-center gap-3 border-t border-accent/20 pt-4">
          <div className="w-full rounded-xl bg-background px-3 py-2 text-center">
            <p className="text-[11px] text-primary/50">اسم الشبكة</p>
            <p className="text-sm font-bold text-primary">{ssid}</p>
          </div>

          <div className="w-full rounded-xl bg-background px-3 py-2 text-center">
            <p className="text-[11px] text-primary/50">كلمة المرور</p>
            <p dir="ltr" className="text-sm font-bold tracking-widest text-primary">
              {password}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-background"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "تم النسخ" : "نسخ كلمة المرور"}
          </button>

          <img src={qrDataUrl} alt="رمز QR للاتصال بالواي فاي" className="h-32 w-32 rounded-xl" />
          <p className="text-center text-[11px] leading-relaxed text-primary/50">
            آيفون: اضغط مطوّلاً على الرمز للاتصال مباشرة
          </p>
        </div>
      )}
    </div>
  );
}
