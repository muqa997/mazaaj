"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { SYNC_EVENT, SYNC_TOPICS, type SyncScope } from "@/lib/sync-signal";

/**
 * تستمع لإشارة التغيير الخاصة بقسم معيّن فتُنفّذ onSignal فوراً (عادةً إعادة جلب
 * البيانات). لا تصل مع الإشارة أي بيانات — الجلب يبقى عبر المسار المحمي.
 *
 * `fallbackMs`: مؤقّت احتياطي بطيء يضمن وصول التغييرات حتى لو انقطع الاتصال
 * (شبكة ضعيفة، أو الجهاز نام). **صفر = مُعطَّل**، فيبقى التحديث دفعاً محضاً بلا أي
 * طلب دوري — وهذا هو الوضع المفضّل: الاستطلاع الدوري هو ما يستهلك الخطة المجانية،
 * أما الإشارة فرسالة واحدة عند التغيير الفعلي فقط.
 */
export function useSyncSignal(
  scope: SyncScope,
  onSignal: () => void,
  fallbackMs = 0
) {
  // نحفظ أحدث نسخة من الدالة بمرجع حتى لا نُعيد الاشتراك بالقناة مع كل تصيير
  const handlerRef = useRef(onSignal);
  handlerRef.current = onSignal;

  useEffect(() => {
    const fire = () => handlerRef.current();

    const interval = fallbackMs > 0 ? setInterval(fire, fallbackMs) : null;
    const clear = () => {
      if (interval) clearInterval(interval);
    };

    if (!supabase) return clear;

    const channel = supabase.channel(SYNC_TOPICS[scope]);
    channel.on("broadcast", { event: SYNC_EVENT }, fire).subscribe();

    // نُحدّث فور عودة الصفحة للواجهة: المتصفح يجمّد المؤقّتات والاتصال بالخلفية،
    // فقد تكون الشاشة قديمة لحظة رجوع الموظف إليها
    const onVisible = () => {
      if (document.visibilityState === "visible") fire();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clear();
      document.removeEventListener("visibilitychange", onVisible);
      supabase?.removeChannel(channel);
    };
  }, [scope, fallbackMs]);
}
