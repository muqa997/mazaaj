"use client";

import { useEffect, useState } from "react";

/**
 * وقت حالي يتحدّث كل ثانية — لعدّادات البلي ستيشن.
 *
 * يبدأ بـ null ثم يُملأ داخل useEffect: لو أُعطي قيمة أولية لاختلف الناتج بين التصيير
 * الخادمي والمتصفح وسبّب خطأ hydration. والمكوّنات تعرض الوقت المحفوظ بقاعدة البيانات
 * ريثما يصل أول تحديث، فلا تومض الشاشة فارغة
 */
export function useNow(active: boolean): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    if (!active) {
      setNow(null);
      return;
    }
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [active]);

  return now;
}
