"use client";

import { useState } from "react";
import { Star, MessageCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const MAX_LENGTH = 300;

export default function ReviewCard({ reviewUrl }: { reviewUrl: string }) {
  const [open, setOpen] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    try {
      if (!supabase) throw new Error("Supabase غير مربوط بعد");
      const { error } = await supabase
        .from("suggestions")
        .insert({ type: "qrFeedback", message });
      if (error) throw error;
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <div className="flex flex-col rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex flex-col items-center gap-2 text-center"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/20">
          <Star size={20} className="text-amber-600" />
        </span>
        <span className="text-sm font-extrabold text-primary">قيّم تجربتك ⭐</span>
        <span className="text-[11px] text-primary/50">شاركنا رأيك بالكافيه</span>
      </button>

      {open && (
        <div className="mt-4 flex flex-col gap-3 border-t border-amber-500/20 pt-4">
          {!showFeedbackForm ? (
            <>
              <p className="text-center text-xs leading-relaxed text-primary/70">
                إذا أعجبتك خدمتنا نتشرف بتقييمك ⭐ ليصلنا زبائن أكثر، وإذا واجهت أي
                ملاحظة نحب نسمعها منك مباشرة لنحسّن خدمتنا
              </p>
              <a
                href={reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-full bg-amber-500 px-4 py-2.5 text-xs font-bold text-white"
              >
                <Star size={14} />
                إرسال تقييم إيجابي
              </a>
              <button
                type="button"
                onClick={() => setShowFeedbackForm(true)}
                className="flex items-center justify-center gap-1.5 rounded-full bg-primary/10 px-4 py-2.5 text-xs font-bold text-primary"
              >
                <MessageCircle size={14} />
                عندي ملاحظة سلبية
              </button>
            </>
          ) : status === "success" ? (
            <div className="flex flex-col items-center gap-1.5 py-2 text-center">
              <CheckCircle2 size={28} className="text-accent" />
              <p className="text-sm font-bold text-primary">وصلتنا ملاحظتك، شكراً لك</p>
              <p className="text-[11px] text-primary/50">سنعمل على تحسين خدمتنا</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
              <textarea
                required
                rows={3}
                maxLength={MAX_LENGTH}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="أخبرنا بما حدث..."
                className="w-full resize-none rounded-xl border border-primary/15 bg-background px-3 py-2.5 text-xs text-primary outline-none focus:border-accent"
              />
              {status === "error" && (
                <p className="text-[11px] text-red-500">حدث خطأ، حاول مرة أخرى</p>
              )}
              <button
                type="submit"
                disabled={!message.trim() || status === "submitting"}
                className="rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-background disabled:opacity-50"
              >
                {status === "submitting" ? "جارِ الإرسال..." : "إرسال للإدارة"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
