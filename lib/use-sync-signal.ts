"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { SYNC_EVENT, SYNC_TOPICS, type SyncScope } from "@/lib/sync-signal";

/**
 * تستمع لإشارة التغيير الخاصة بقسم معيّن فتُنفّذ onSignal فوراً (عادةً إعادة جلب
 * البيانات). لا تصل مع الإشارة أي بيانات — الجلب يبقى عبر المسار المحمي.
 *
 * `fallbackMs`: مؤقّت احتياطي بطيء يضمن وصول التغييرات حتى لو انقطع الاتصال
 * (شبكة الموظف ضعيفة، أو الجهاز نام) — فلا تعلق أي صفحة ببيانات قديمة أبداً.
 */
export function useSyncSignal(
  scope: SyncScope,
  onSignal: () => void,
  fallbackMs = 10000
) {
  // نحفظ أحدث نسخة من الدالة بمرجع حتى لا نُعيد الاشتراك بالقناة مع كل تصيير
  const handlerRef = useRef(onSignal);
  handlerRef.current = onSignal;

  useEffect(() => {
    const fire = () => handlerRef.current();

    const interval = setInterval(fire, fallbackMs);

    if (!supabase) return () => clearInterval(interval);

    const channel = supabase.channel(SYNC_TOPICS[scope]);
    channel.on("broadcast", { event: SYNC_EVENT }, fire).subscribe();

    // نُحدّث فور عودة الصفحة للواجهة: المتصفح يجمّد المؤقّتات والاتصال بالخلفية،
    // فقد تكون الشاشة قديمة لحظة رجوع الموظف إليها
    const onVisible = () => {
      if (document.visibilityState === "visible") fire();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      supabase?.removeChannel(channel);
    };
  }, [scope, fallbackMs]);
}
