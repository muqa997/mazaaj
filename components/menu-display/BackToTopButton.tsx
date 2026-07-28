"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

const SHOW_AFTER_PX = 600;

// زر عائم أسفل الشاشة يظهر بعد التمرير بمسافة معقولة، ويعيد المستخدم لأعلى
// الصفحة بسلاسة — مفيد بصفحة طويلة متصلة بلا أي عناصر تنقّل أخرى
export default function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="العودة للأعلى"
          className="fixed bottom-6 end-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-background shadow-glass-lg"
        >
          <ArrowUp size={18} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
