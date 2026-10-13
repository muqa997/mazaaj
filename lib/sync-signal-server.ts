import { SYNC_EVENT, SYNC_TOPICS, type SyncScope } from "@/lib/sync-signal";

// إرسال إشارة التغيير من الخادم عبر HTTP (بلا اتصال دائم) — مهم لأن Vercel يقطع
// الاتصالات طويلة الأمد ويحاسب على مدتها، فلا يصلح إبقاء اشتراك Realtime بالخادم.
//
// تُستدعى بعد نجاح الكتابة لا قبلها، حتى تجد الصفحات البيانات الجديدة عند الجلب.
export async function sendSyncSignal(scope: SyncScope): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  try {
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ topic: SYNC_TOPICS[scope], event: SYNC_EVENT, payload: {} }],
      }),
      cache: "no-store",
    });
  } catch (error) {
    // الإشارة تسريع فقط وليست مصدر الحقيقة — لو فشلت يبقى المؤقّت الاحتياطي
    // بكل صفحة يلتقط التغيير، فلا نُفشل العملية الأصلية بسببها
    console.error("sync signal failed:", error);
  }
}

// غلاف مختصر لنتائج الـ actions: يرسل الإشارة عند النجاح فقط ثم يُعيد النتيجة كما هي،
// حتى لا تتحدث الصفحات الأخرى على عملية فاشلة
export async function signalOnSuccess<T extends { error: string | null }>(
  scope: SyncScope,
  result: T
): Promise<T> {
  if (!result.error) await sendSyncSignal(scope);
  return result;
}
