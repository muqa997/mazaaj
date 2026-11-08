"use client";

import { useState } from "react";
import { AlertTriangle, Clock, Minus, Play, Plus, Send, SlidersHorizontal, X } from "lucide-react";
import {
  computePlaystationAmount,
  elapsedMinutes,
  formatDuration,
  formatElapsed,
  isStaleSession,
  minutesToNextQuarter,
  PS_DURATION_PRESETS,
  PS_MAX_SESSION_MINUTES,
  PS_MINUTES_PER_QUARTER,
  PS_QUARTER_PRICE,
  roundUpToQuarter,
  type PlaystationDeviceRow,
} from "@/lib/playstation";
import { useNow } from "@/lib/use-now";

type PlaystationCardProps = {
  device: PlaystationDeviceRow;
  customerRef: string;
  busy: boolean;
  onCustomerRefChange: (value: string) => void;
  onCustomerRefBlur: () => void;
  onCustomerRefFocus: () => void;
  onStart: () => void;
  onBill: (minutes: number) => void;
  onSetStart: (isoLocal: string) => void;
};

/** «٢٠٢٦-١١-٠٧T٢١:٣٠» بالتوقيت المحلي — الصيغة التي يقبلها حقل datetime-local */
function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

/**
 * جهاز بلي ستيشن واحد: عدّاد حي وسعر يرتفع كل ربع ساعة.
 *
 * الوقت يُحسب من `started_at` المحفوظ بقاعدة البيانات لا من عدّاد بالمتصفح — فيبقى
 * صحيحاً بعد تحديث الصفحة، ومتطابقاً على شاشة الموظف والكاشير معاً
 */
export default function PlaystationCard({
  device,
  customerRef,
  busy,
  onCustomerRefChange,
  onCustomerRefBlur,
  onCustomerRefFocus,
  onStart,
  onBill,
  onSetStart,
}: PlaystationCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  // شاشة تثبيت المدة قبل الترحيل: تُفتح عند الإنهاء وعند تسجيل جلسة بلا عدّاد
  const [picking, setPicking] = useState<null | "end" | "fixed">(null);
  const [pick, setPick] = useState(PS_MINUTES_PER_QUARTER);

  const running = Boolean(device.started_at);
  const now = useNow(running);
  const at = now ?? new Date();

  const minutes = device.started_at ? elapsedMinutes(device.started_at, at) : 0;
  const amount = computePlaystationAmount(minutes);
  const toNext = minutesToNextQuarter(minutes);
  const stale = device.started_at ? isStaleSession(device.started_at, at) : false;

  const pickAmount = computePlaystationAmount(pick);
  const stepPick = (delta: number) =>
    setPick((m) =>
      Math.min(
        PS_MAX_SESSION_MINUTES,
        Math.max(PS_MINUTES_PER_QUARTER, m + delta * PS_MINUTES_PER_QUARTER)
      )
    );

  // الإنهاء يبدأ من الوقت المقيس مقرَّباً للربع — رقمٌ صحيح افتراضاً، والموظف يعدّله
  // إن اتفق مع الزبون على غيره
  const openEnd = () => {
    setPick(Math.max(PS_MINUTES_PER_QUARTER, roundUpToQuarter(minutes)));
    setPicking("end");
  };
  const openFixed = () => {
    setPick(60);
    setPicking("fixed");
  };

  const openEditor = () => {
    setDraft(toLocalInput(device.started_at ? new Date(device.started_at) : new Date()));
    setEditing(true);
  };

  return (
    <div
      className="relative flex flex-col gap-3.5 overflow-hidden rounded-3xl p-5 shadow-glass"
      style={{ backgroundColor: "#2a1a6b" }}
    >
      {running && (
        <span className="absolute start-1/2 top-3 z-10 flex h-3 w-3 -translate-x-1/2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
        </span>
      )}

      <div className="relative z-10 flex items-start justify-between gap-3">
        <h2 className="text-xl font-extrabold text-white">
          بلي ستيشن {device.device_number.toLocaleString("en-US")}
        </h2>
        <div dir="ltr" className="text-left">
          <p className="text-xl font-extrabold tabular-nums text-white">
            {running ? formatElapsed(device.started_at!, at) : "--:--"}
          </p>
          <p className="text-sm font-semibold text-white/70">
            {amount.toLocaleString("en-US")}
          </p>
        </div>
      </div>

      {/* تنبيه الجلسة المنسية: العدّاد لا يتوقف وحده، فننبّه بدل أن يتضخّم المبلغ بصمت */}
      {stale && (
        <div className="relative z-10 flex items-center gap-2 rounded-xl bg-red-500/25 px-3 py-2">
          <AlertTriangle size={15} className="shrink-0 text-red-200" />
          <p className="text-[12px] font-bold text-red-100">
            شغّال منذ أكثر من ٣ ساعات — تأكد أن اللعب ما زال جارياً
          </p>
        </div>
      )}

      <div className="relative z-10 rounded-2xl bg-black/50 px-4 py-3">
        {running ? (
          <>
            <p className="text-center text-[13px] font-bold text-white/80">
              {minutes.toLocaleString("en-US")} دقيقة ·{" "}
              {Math.ceil(minutes / 15).toLocaleString("en-US")} ربع
            </p>
            <p className="mt-1 text-center text-[11px] text-white/45">
              بعد {toNext.toLocaleString("en-US")} دقيقة يصير{" "}
              {(amount + PS_QUARTER_PRICE).toLocaleString("en-US")} د.ع
            </p>
          </>
        ) : (
          <p className="text-center text-[13px] font-bold text-white/55">
            الجهاز متوقف — ١٠٠٠ د.ع لكل ربع ساعة
          </p>
        )}
      </div>

      {/* تثبيت المدة قبل الترحيل. الحساب بالربع أصلاً، فالاختيار بالأرباع لا بالدقائق */}
      {picking && (
        <div className="relative z-10 flex flex-col gap-3 rounded-2xl bg-black/50 p-3">
          <p className="text-[12px] font-bold text-white/60">
            {picking === "end"
              ? `العدّاد سجّل ${minutes.toLocaleString("en-US")} دقيقة — ثبّت المدة`
              : "مدة اللعب (جلسة بلا عدّاد)"}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => stepPick(-1)}
              disabled={pick <= PS_MINUTES_PER_QUARTER}
              aria-label="أنقص ربع ساعة"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white disabled:opacity-30"
            >
              <Minus size={18} />
            </button>
            <div className="flex-1 rounded-xl bg-white/10 py-2 text-center">
              <p className="text-base font-extrabold text-white">{formatDuration(pick)}</p>
              <p className="text-sm font-bold text-green-300">
                {pickAmount.toLocaleString("en-US")} د.ع
              </p>
            </div>
            <button
              type="button"
              onClick={() => stepPick(1)}
              disabled={pick >= PS_MAX_SESSION_MINUTES}
              aria-label="زد ربع ساعة"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white disabled:opacity-30"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {PS_DURATION_PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPick(m)}
                className={`min-h-[38px] rounded-lg px-1 text-[12px] font-bold ${
                  pick === m ? "bg-white text-[#2a1a6b]" : "bg-white/15 text-white/80"
                }`}
              >
                {formatDuration(m)}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onBill(pick);
                setPicking(null);
              }}
              disabled={busy}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-white text-sm font-extrabold text-[#2a1a6b] disabled:opacity-50"
            >
              <Send size={16} />
              {busy ? "..." : `رحّل ${pickAmount.toLocaleString("en-US")} د.ع`}
            </button>
            <button
              type="button"
              onClick={() => setPicking(null)}
              aria-label="إلغاء"
              className="flex min-h-[48px] w-12 items-center justify-center rounded-xl bg-white/15 text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* تعديل وقت البداية: يُستعمل حين ينسى الموظف الضغط على «بدء» */}
      {editing ? (
        <div className="relative z-10 flex flex-col gap-2 rounded-2xl bg-black/50 p-3">
          <span className="text-[11px] font-bold text-white/60">وقت بدء اللعب الحقيقي</span>
          <input
            type="datetime-local"
            value={draft}
            max={toLocalInput(new Date())}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[44px] rounded-xl bg-white/95 px-3 text-base font-bold text-[#2a1a6b] outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onSetStart(draft);
                setEditing(false);
              }}
              className="min-h-[44px] flex-1 rounded-xl bg-white text-sm font-extrabold text-[#2a1a6b]"
            >
              حفظ
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              aria-label="إلغاء"
              className="flex min-h-[44px] w-12 items-center justify-center rounded-xl bg-white/15 text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex items-stretch gap-2">
          <input
            value={customerRef}
            onChange={(e) => onCustomerRefChange(e.target.value)}
            onFocus={onCustomerRefFocus}
            onBlur={onCustomerRefBlur}
            maxLength={30}
            placeholder="اسم الزبون (اختياري)"
            className="min-h-[46px] min-w-0 flex-1 rounded-xl bg-black/50 px-3 text-base font-bold text-white outline-none placeholder:text-[13px] placeholder:font-normal placeholder:text-white/35"
          />
          {running && (
            <button
              type="button"
              onClick={openEditor}
              aria-label="تعديل وقت البداية"
              className="flex min-h-[46px] w-12 items-center justify-center rounded-xl bg-black/50 text-white/75"
            >
              <SlidersHorizontal size={17} />
            </button>
          )}
        </div>
      )}

      {running ? (
        <button
          type="button"
          onClick={openEnd}
          disabled={busy || Boolean(picking)}
          className="relative z-10 flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-white text-base font-extrabold text-[#2a1a6b] disabled:opacity-50"
        >
          <Send size={18} />
          {busy ? "..." : "إنهاء وتثبيت المدة"}
        </button>
      ) : (
        <div className="relative z-10 flex gap-2">
          <button
            type="button"
            onClick={onStart}
            disabled={busy || Boolean(picking)}
            className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-green-500 text-base font-extrabold text-white disabled:opacity-50"
          >
            <Play size={18} />
            {busy ? "..." : "بدء اللعب"}
          </button>
          {/* الجلسة التي فات تشغيل عدّادها: تُسجَّل بمدتها وتُرحَّل بلا عدّاد */}
          <button
            type="button"
            onClick={openFixed}
            disabled={busy || Boolean(picking)}
            className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-white/15 text-sm font-extrabold text-white disabled:opacity-50"
          >
            <Clock size={16} />
            وقت ثابت
          </button>
        </div>
      )}

      <Clock
        size={120}
        className="pointer-events-none absolute -left-6 -bottom-6 text-white/[0.05]"
        aria-hidden="true"
      />
    </div>
  );
}
