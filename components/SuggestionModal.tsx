"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const TYPE_KEYS = [
  "bug",
  "uiImprovement",
  "newFeature",
  "poorService",
  "inquiry",
  "compliment",
  "other",
] as const;

const MAX_LENGTH = 150;

export default function SuggestionModal({ label }: { label: string }) {
  const t = useTranslations("suggestions");
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const close = () => {
    setIsOpen(false);
    setTimeout(() => {
      setType("");
      setMessage("");
      setStatus("idle");
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      if (!supabase) throw new Error("Supabase is not configured yet");
      const { error } = await supabase.from("suggestions").insert({ type, message });
      if (error) throw error;
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-sm text-primary/60 transition-colors hover:text-accent"
      >
        {label}
      </button>

      <AnimatePresence>
        {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 z-[70] flex items-center justify-center bg-primary/30 p-5 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl bg-background p-6 shadow-glass-lg"
              >
              <button
                type="button"
                onClick={close}
                aria-label="close"
                className="absolute end-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary/5"
              >
                <X size={16} className="text-primary/60" />
              </button>

              {status === "success" ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <CheckCircle2 size={40} className="mb-3 text-accent" />
                  <h3 className="mb-1 text-lg font-extrabold text-primary">
                    {t("thanksTitle")}
                  </h3>
                  <p className="text-sm text-primary/60">{t("thanksMessage")}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
                  <div>
                    <h3 className="mb-1 text-lg font-extrabold text-primary">
                      {t("heading")}
                    </h3>
                    <p className="text-sm text-primary/50">{t("subheading")}</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-primary">
                      {t("typeLabel")}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {TYPE_KEYS.map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setType(key)}
                          className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
                            type === key
                              ? "bg-primary text-background"
                              : "bg-primary/5 text-primary/60"
                          }`}
                        >
                          {t(`types.${key}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-primary">
                      {t("messageLabel")}
                    </label>
                    <textarea
                      required
                      rows={3}
                      maxLength={MAX_LENGTH}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t("messagePlaceholder")}
                      className="w-full resize-none rounded-xl border border-primary/15 bg-background px-4 py-3 text-sm text-primary outline-none focus:border-accent"
                    />
                    <p className="mt-1 text-end text-xs text-primary/40">
                      {message.length}/{MAX_LENGTH}
                    </p>
                  </div>

                  {status === "error" && (
                    <p className="text-sm text-red-500">{t("errorMessage")}</p>
                  )}

                  <button
                    type="submit"
                    disabled={!type || !message || status === "submitting"}
                    className="rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-background transition-opacity disabled:opacity-50"
                  >
                    {status === "submitting" ? t("submitting") : t("submit")}
                  </button>
                </form>
              )}
              </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
