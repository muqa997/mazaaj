"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import {
  TOURNAMENT_RULES,
  formatTournamentDate,
  type TeamInput,
  type TournamentRow,
} from "@/lib/tournaments";

type TournamentPageProps = {
  tournament: TournamentRow | null;
  teamCount: number;
  registerTeam: (tournamentId: string, input: TeamInput) => Promise<{ error: string | null }>;
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

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center">
      {/* tabular-nums يثبّت عرض الأرقام فلا تهتزّ الخانات كل ثانية */}
      <span className="text-[30px] font-black leading-none tabular-nums text-background">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-1.5 text-[10px] font-medium text-background/45">{label}</span>
    </div>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-bold text-primary/50">{label}</span>
      {/* 16px مقاس إلزامي للحقول: أي أصغر يجعل سفاري بالآيفون يزوّم تلقائياً عند الكتابة */}
      <input
        {...props}
        className="w-full rounded-2xl border border-primary/10 bg-primary/[0.03] px-4 py-3.5 text-base font-medium text-primary outline-none transition-colors placeholder:font-normal placeholder:text-primary/25 focus:border-accent focus:bg-background"
      />
    </label>
  );
}

const EMPTY_FORM: TeamInput = { player1_name: "", player2_name: "", phone: "" };

export default function TournamentPageClient({
  tournament,
  teamCount,
  registerTeam,
}: TournamentPageProps) {
  const [form, setForm] = useState<TeamInput>(EMPTY_FORM);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");

  const remaining = useCountdown(tournament?.registration_closes_at);

  if (!tournament) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <Image src="/mazaaj-logo-trimmed.png" alt="كافيه مزاج" width={140} height={114} priority />
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

  const infoRows: { label: string; value: string }[] = [
    { label: "الموعد", value: formatTournamentDate(tournament.starts_at) },
    {
      label: "الاشتراك",
      value: `${tournament.entry_fee.toLocaleString("en-US")} د.ع للفريق`,
    },
    {
      label: "الفرق",
      value:
        seatsLeft === null
          ? `${teamCount.toLocaleString("en-US")} فريق مسجَّل`
          : `${teamCount.toLocaleString("en-US")} من ${tournament.max_teams!.toLocaleString("en-US")} — متبقٍ ${seatsLeft.toLocaleString("en-US")}`,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-md pb-14">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="rounded-b-[2.5rem] bg-primary px-6 pb-8 pt-9 text-center"
      >
        <Image
          src="/mazaaj-logo-white.png"
          alt="كافيه مزاج"
          width={104}
          height={85}
          priority
          className="mx-auto mb-6 opacity-90"
        />

        <span className="inline-block rounded-full bg-accent/20 px-3.5 py-1 text-[11px] font-bold tracking-wide text-accent">
          {tournament.category}
        </span>

        <h1 className="mx-auto mt-3 max-w-[11ch] text-[32px] font-black leading-[1.15] text-background">
          {tournament.title}
        </h1>

        <div className="mt-7 border-t border-background/10 pt-6">
          <p className="mb-4 text-[11px] font-bold tracking-wide text-background/45">
            {closed ? "أُغلق باب التسجيل" : "ينتهي التسجيل خلال"}
          </p>

          {closed ? (
            <p className="text-lg font-black text-background">
              {isFull && !deadlinePassed ? "اكتمل عدد الفرق" : "انتهى وقت التسجيل"}
            </p>
          ) : (
            /* بلا dir="ltr": بالاتجاه العربي تبدأ الخانات من اليمين فتُقرأ
               «يوم ← ساعة ← دقيقة ← ثانية» بترتيبها الطبيعي */
            <div className="flex items-start">
              <CountdownUnit value={remaining?.days ?? 0} label="يوم" />
              <CountdownUnit value={remaining?.hours ?? 0} label="ساعة" />
              <CountdownUnit value={remaining?.minutes ?? 0} label="دقيقة" />
              <CountdownUnit value={remaining?.seconds ?? 0} label="ثانية" />
            </div>
          )}
        </div>
      </motion.section>

      <section className="px-6">
        {/* تتداخل البطاقة قليلاً مع الترويسة الداكنة لكسر الفصل بينهما — مع حشوة
            علوية صغيرة حتى لا يلتصق أول صف بحافة الترويسة */}
        <div className="-mt-5 rounded-3xl border border-primary/8 bg-background px-5 pt-2 shadow-glass">
          {infoRows.map((row, i) => (
            <div
              key={row.label}
              className={`flex items-center justify-between gap-4 py-3.5 ${
                i > 0 ? "border-t border-primary/[0.07]" : ""
              }`}
            >
              <span className="shrink-0 text-xs font-bold text-primary/40">{row.label}</span>
              <span className="text-end text-sm font-bold text-primary">{row.value}</span>
            </div>
          ))}
        </div>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-primary/45">
          التسجيل هنا <span className="font-bold text-primary/70">حجز فقط</span> — يُدفع
          الاشتراك نقداً في الكافيه.
        </p>
      </section>

      {status === "success" ? (
        <section className="mt-8 px-6">
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-primary px-6 py-9 text-center">
            <CheckCircle2 size={40} className="text-accent" />
            <h2 className="text-xl font-black text-background">تم تسجيل فريقك</h2>
            <p className="max-w-[26ch] text-sm leading-relaxed text-background/60">
              نراك يوم البطولة — تذكّر دفع{" "}
              <span className="font-bold text-background">
                {tournament.entry_fee.toLocaleString("en-US")} د.ع
              </span>{" "}
              نقداً في الكافيه قبل بداية المباريات.
            </p>
          </div>
        </section>
      ) : (
        !closed && (
          <section className="mt-9 px-6">
            <h2 className="mb-5 text-xl font-black text-primary">سجّل فريقك</h2>
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
                className="mt-1 flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-black text-background transition-opacity active:scale-[0.99] disabled:opacity-50"
              >
                {status === "submitting" ? "جارِ التسجيل..." : "تأكيد التسجيل"}
                {status !== "submitting" && <ArrowLeft size={18} className="ltr:rotate-180" />}
              </button>
            </form>
          </section>
        )
      )}

      <section className="mt-12 px-6">
        <h2 className="mb-6 text-xl font-black text-primary">القوانين</h2>
        <div className="flex flex-col gap-7">
          {TOURNAMENT_RULES.map((group) => (
            <div key={group.title}>
              <h3 className="mb-3 text-[11px] font-black tracking-wide text-accent">
                {group.title}
              </h3>
              <ul className="flex flex-col gap-3">
                {group.items.map((item, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/5 text-[10px] font-black tabular-nums text-primary/40">
                      {i + 1}
                    </span>
                    <p className="text-[13px] leading-[1.9] text-primary/65">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-14 text-center text-[11px] font-medium text-primary/25">كافيه مزاج</p>
    </main>
  );
}
