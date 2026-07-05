"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";

export default function OfflineBanner({
  offlineText = "لا يوجد اتصال بالإنترنت حالياً",
  backOnlineText = "تم استعادة الاتصال بالإنترنت",
  topOffset = "calc(64px + env(safe-area-inset-top))",
}: {
  offlineText?: string;
  backOnlineText?: string;
  topOffset?: string;
}) {
  const [isOffline, setIsOffline] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOnline = () => {
      setIsOffline(false);
      setJustReconnected(true);
      setTimeout(() => setJustReconnected(false), 2500);
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {(isOffline || justReconnected) && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{ top: topOffset }}
          className={`fixed inset-x-0 z-40 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-background ${
            isOffline ? "bg-primary" : "bg-accent"
          }`}
        >
          {isOffline ? (
            <>
              <WifiOff size={16} />
              {offlineText}
            </>
          ) : (
            <>
              <Wifi size={16} />
              {backOnlineText}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
