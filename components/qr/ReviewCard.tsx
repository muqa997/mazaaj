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
    <div className="flex flex-col rounded-3xl border border-amber-400/30 bg-amber-400/10 p-5 backdrop-blur-xl shadow-glass-lg">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex flex-col items-center gap-2.5 text-center"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/20">
          <span className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={9} className="fill-amber-400 text-amber-400" />
            ))}
          </span>
        </span>
        <span className="text-sm font-extrabold text-primary">قيّم تجربتك</span>
        <span className="text-[11px] text-primary/50">شاركنا رأيك بالكافيه</span>
      </button>

      {open && (
        <div className="mt-4 flex flex-col gap-3 border-t border-amber-400/20 pt-4">
          {!showFeedbackForm ? (
            <>
              <p className="whitespace-pre-line text-center text-xs leading-relaxed text-primary/70">
                {"إذا أعجبتك خدمتنا نتشرف ونأمل\nأن تقيّمنا لنصل لزبائن أكثر\n\nوإذا واجهت أي ملاحظة أو مشكلة\nنحب سماعها منك مباشرة\nلنحسّن خدماتنا للأفضل"}
              </p>
              <a
                href={reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-full bg-amber-400 px-4 py-2.5 text-xs font-bold text-[#1a120e]"
              >
                <Star size={14} />
                إرسال تقييم إيجابي
              </a>
              <button
                type="button"
                onClick={() => setShowFeedbackForm(true)}
                className="flex items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold text-primary"
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
                className="w-full resize-none rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-xs text-primary outline-none focus:border-accent"
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
