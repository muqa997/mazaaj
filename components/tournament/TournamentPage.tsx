"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import {
  TOURNAMENT_RULES,
  formatTournamentDate,
  type TeamInput,
  type TournamentRow,
} from "@/lib/tournaments";
import { Club, Diamond, Heart, Spade, SuitRow } from "./CardSuits";

type TournamentPageProps = {
  tournament: TournamentRow | null;
  teamCount: number;
  registerTeam: (tournamentId: string, input: TeamInput) => Promise<{ error: string | null }>;
  // يظهر زر رجوع حين تُفتح البطولة من قائمة البطولات، لا حين تكون البطولة الوحيدة
  backHref?: string;
};

type Remaining = { days: number; hours: number; minutes: number; seconds: number; done: boolean };

// العدّاد يُحسب بالمتصفح فقط (يبدأ بـ null ثم يُملأ داخل useEffect) — لو حُسب أثناء
// التصيير الخادمي لاختلف الناتج بين الخادم والمتصفح وسبّب خطأ hydration
function useCountdown(targetIso: string | undefined): Remaining | null {
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    if (!targetIso) return;
    const target = new Date(targetIso).getTime();

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, done: true });
        return;
      }
      setRemaining({
        days: Math.floor(diff / 86400000),
        hours: Math.floor(diff / 3600000) % 24,
        minutes: Math.floor(diff / 60000) % 60,
        seconds: Math.floor(diff / 1000) % 60,
        done: false,
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  return remaining;
}

// كل خانة لوح زجاجي قائم بذاته: الرقم كبير جداً ليُقرأ بطرف العين، واللصيقة تحته
// صغيرة وهادئة. tabular-nums يثبّت عرض الأرقام فلا تهتزّ الخانات كل ثانية
function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.06] py-3.5 [box-shadow:inset_0_1px_0_rgba(255,255,255,0.18)]">
      <span className="text-[30px] font-black leading-none tabular-nums text-background">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] font-bold text-background/45">{label}</span>
    </div>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] font-black tracking-wide text-primary/45">{label}</span>
      {/* 16px مقاس إلزامي للحقول: أي أصغر يجعل سفاري بالآيفون يزوّم تلقائياً عند الكتابة */}
      <input
        {...props}
        className="min-h-[52px] w-full rounded-2xl border border-primary/10 bg-primary/[0.03] px-4 text-base font-semibold text-primary outline-none transition-colors placeholder:font-normal placeholder:text-primary/25 focus:border-accent focus:bg-background"
      />
    </label>
  );
}

const EMPTY_FORM: TeamInput = { player1_name: "", player2_name: "", phone: "" };

export default function TournamentPageClient({
  tournament,
  teamCount,
  registerTeam,
  backHref,
}: TournamentPageProps) {
  const [form, setForm] = useState<TeamInput>(EMPTY_FORM);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");
  const formRef = useRef<HTMLElement | null>(null);

  const remaining = useCountdown(tournament?.registration_closes_at);

  if (!tournament) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <Image src="/mazaaj-logo-trimmed.png" alt="كافيه مزاج" width={140} height={114} priority />
        <SuitRow size={15} className="text-accent/60" />
        <h1 className="text-2xl font-black text-primary">لا توجد بطولة مفتوحة حالياً</h1>
        <p className="text-sm text-primary/50">تابعنا لمعرفة موعد البطولة القادمة.</p>
      </main>
    );
  }

  const seatsLeft =
    tournament.max_teams !== null ? Math.max(0, tournament.max_teams - teamCount) : null;
  const deadlinePassed =
    remaining?.done ?? new Date(tournament.registration_closes_at) <= new Date();
  const isFull = seatsLeft === 0;
  const closed = deadlinePassed || isFull;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError("");

    const result = await registerTeam(tournament.id, form);
    if (result.error) {
      setError(result.error);
      setStatus("idle");
      return;
    }
    setStatus("success");
  };

  const stats: { label: string; value: string; sub?: string }[] = [
    {
      label: "الموعد",
      value: formatTournamentDate(tournament.starts_at),
    },
    {
      label: "الاشتراك",
      value: `${tournament.entry_fee.toLocaleString("en-US")} د.ع`,
      sub: "للفريق الواحد — نقداً بالكافيه",
    },
    {
      label: "الفرق",
      value:
        seatsLeft === null
          ? `${teamCount.toLocaleString("en-US")} فريق`
          : `${teamCount.toLocaleString("en-US")} / ${tournament.max_teams!.toLocaleString("en-US")}`,
      sub:
        seatsLeft === null
          ? "مسجَّلة حتى الآن"
          : `متبقٍ ${seatsLeft.toLocaleString("en-US")} مقعد`,
    },
  ];

  const showStickyCta = !closed && status !== "success";

  return (
    <main className={`mx-auto w-full max-w-md ${showStickyCta ? "pb-32" : "pb-16"}`}>
      {/* ═══ الترويسة: لوح داكن بهالات ذهبية مموّهة وعلامات مائية من رموز الورق ═══ */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-b-[2.5rem] bg-[#1C120B] px-6 pb-12 pt-10 text-center"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-accent/55 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-[#B8793F]/60 blur-3xl"
        />
        <Spade size={150} className="pointer-events-none absolute -left-8 top-16 text-white/[0.035]" />
        <Club size={120} className="pointer-events-none absolute -right-6 top-44 text-white/[0.03]" />

        {backHref && (
          <a
            href={backHref}
            className="absolute end-0 top-0 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.07] text-background/80 backdrop-blur-xl"
            aria-label="رجوع لقائمة البطولات"
          >
            <ArrowRight size={18} className="ltr:rotate-180" />
          </a>
        )}

        <div className="relative">
          <Image
            src="/mazaaj-logo-white.png"
            alt="كافيه مزاج"
            width={96}
            height={78}
            priority
            className="mx-auto mb-7 opacity-90"
          />

          <SuitRow size={14} className="mb-4 justify-center text-accent/75" />

          <span className="inline-block rounded-full border border-white/15 bg-white/[0.07] px-4 py-1.5 text-[11px] font-bold text-background/80">
            {tournament.category}
          </span>

          <h1 className="mx-auto mt-4 max-w-[11ch] text-[36px] font-black leading-[1.12] text-background">
            {tournament.title}
          </h1>

          <div className="mt-8">
            <p className="mb-3.5 text-[11px] font-black tracking-wide text-accent/80">
              {closed ? "أُغلق باب التسجيل" : "ينتهي التسجيل خلال"}
            </p>

            {closed ? (
              <p className="rounded-2xl border border-white/10 bg-white/[0.06] py-4 text-lg font-black text-background">
                {isFull && !deadlinePassed ? "اكتمل عدد الفرق" : "انتهى وقت التسجيل"}
              </p>
            ) : (
              /* بلا dir="ltr": بالاتجاه العربي تبدأ الخانات من اليمين فتُقرأ
                 «يوم ← ساعة ← دقيقة ← ثانية» بترتيبها الطبيعي */
              <div className="flex items-stretch gap-2">
                <CountdownUnit value={remaining?.days ?? 0} label="يوم" />
                <CountdownUnit value={remaining?.hours ?? 0} label="ساعة" />
                <CountdownUnit value={remaining?.minutes ?? 0} label="دقيقة" />
                <CountdownUnit value={remaining?.seconds ?? 0} label="ثانية" />
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* ═══ الأرقام الأساسية ═══ */}
      {/* z-10 ضرورية: الترويسة أعلاها تُنشئ سياق طبقات (بسبب حركة الظهور)، فكانت
          تُغطّي أول صف من البطاقة ويختفي نصف سطر التاريخ تحت حافتها المقوّسة */}
      <section className="relative z-10 px-6">
        <div className="-mt-5 overflow-hidden rounded-3xl border border-primary/[0.07] bg-background shadow-glass">
          {stats.map((row, i) => (
            <div
              key={row.label}
              className={`flex items-center justify-between gap-4 px-5 py-4 ${
                i > 0 ? "border-t border-primary/[0.06]" : ""
              }`}
            >
              <span className="shrink-0 text-[11px] font-black tracking-wide text-primary/40">
                {row.label}
              </span>
              <span className="text-end">
                <span className="block text-sm font-black text-primary">{row.value}</span>
                {row.sub && (
                  <span className="mt-0.5 block text-[11px] font-medium text-primary/40">
                    {row.sub}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-3.5 text-center text-[11px] leading-relaxed text-primary/45">
          التسجيل هنا <span className="font-black text-primary/70">حجز فقط</span> — يُدفع
          الاشتراك نقداً في الكافيه.
        </p>
      </section>

      {/* ═══ التسجيل ═══ */}
      {status === "success" ? (
        <section className="mt-9 px-6">
          <div className="relative flex flex-col items-center gap-3 overflow-hidden rounded-3xl bg-[#1C120B] px-6 py-10 text-center">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 right-0 h-56 w-56 rounded-full bg-accent/30 blur-3xl"
            />
            <Diamond
              size={110}
              className="pointer-events-none absolute -bottom-4 -left-4 text-white/[0.04]"
            />
            <CheckCircle2 size={42} className="relative text-accent" />
            <h2 className="relative text-xl font-black text-background">تم تسجيل فريقك</h2>
            <p className="relative max-w-[28ch] text-sm leading-relaxed text-background/60">
              نراك يوم البطولة — تذكّر دفع{" "}
              <span className="font-black text-background">
                {tournament.entry_fee.toLocaleString("en-US")} د.ع
              </span>{" "}
              نقداً في الكافيه قبل بداية المباريات.
            </p>
          </div>
        </section>
      ) : (
        !closed && (
          <section ref={formRef} id="register" className="mt-10 scroll-mt-6 px-6">
            <div className="mb-6 flex items-baseline gap-3">
              <h2 className="text-xl font-black text-primary">سجّل فريقك</h2>
              <span className="h-px flex-1 bg-primary/10" />
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field
                label="اللاعب الأول"
                required
                maxLength={60}
                value={form.player1_name}
                onChange={(e) => setForm({ ...form, player1_name: e.target.value })}
                placeholder="الاسم"
              />
              <Field
                label="اللاعب الثاني"
                required
                maxLength={60}
                value={form.player2_name}
                onChange={(e) => setForm({ ...form, player2_name: e.target.value })}
                placeholder="الاسم"
              />
              <Field
                label="رقم الموبايل"
                required
                type="tel"
                inputMode="tel"
                dir="ltr"
                maxLength={20}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="07XXXXXXXXX"
              />

              {error && (
                <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="mt-1 flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-primary text-base font-black text-background transition-opacity active:scale-[0.99] disabled:opacity-50"
              >
                {status === "submitting" ? "جارِ التسجيل..." : "تأكيد التسجيل"}
                {status !== "submitting" && <ArrowLeft size={18} className="ltr:rotate-180" />}
              </button>
            </form>
          </section>
        )
      )}

      {/* ═══ القوانين ═══ */}
      <section className="mt-14 px-6">
        <div className="mb-7 flex items-baseline gap-3">
          <h2 className="text-xl font-black text-primary">القوانين</h2>
          <span className="h-px flex-1 bg-primary/10" />
        </div>

        <div className="flex flex-col gap-3">
          {TOURNAMENT_RULES.map((group) => (
            <div
              key={group.title}
              className="rounded-3xl border border-primary/[0.07] bg-primary/[0.02] p-5"
            >
              <h3 className="mb-4 flex items-center gap-2.5 text-[12px] font-black tracking-wide text-primary">
                <Heart size={12} className="text-accent" />
                {group.title}
              </h3>
              <ul className="flex flex-col gap-3.5">
                {group.items.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-accent/25 text-[10px] font-black tabular-nums text-primary/70">
                      {i + 1}
                    </span>
                    <p className="text-[13.5px] leading-[1.95] text-primary/70">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-14 flex flex-col items-center gap-3">
        <SuitRow size={13} className="text-primary/15" />
        <p className="text-[11px] font-bold text-primary/25">كافيه مزاج</p>
      </div>

      {/* ═══ زر ثابت أسفل الشاشة: ٩٥٪ من الزوار على الموبايل، والنموذج أسفل الصفحة ═══ */}
      {showStickyCta && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/[0.07] bg-background/85 px-6 py-3 backdrop-blur-xl">
          <a
            href="#register"
            className="mx-auto flex min-h-[52px] max-w-md items-center justify-center gap-2 rounded-2xl bg-primary text-[15px] font-black text-background active:scale-[0.99]"
          >
            سجّل فريقك
            <ArrowLeft size={17} className="ltr:rotate-180" />
          </a>
        </div>
      )}
    </main>
  );
}
