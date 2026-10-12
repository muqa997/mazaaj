"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Coins,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { fadeUp } from "@/lib/motion";
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

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-primary px-2 py-3">
      <span dir="ltr" className="text-2xl font-extrabold text-background sm:text-3xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[11px] font-semibold text-background/60">{label}</span>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-primary/10 bg-background p-4 shadow-glass">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15">
        <Icon size={18} className="text-accent" />
      </span>
      <div className="min-w-0">
        <p className="mb-0.5 text-xs text-primary/50">{label}</p>
        <p className="text-sm font-bold text-primary">{value}</p>
      </div>
    </div>
  );
}

const EMPTY_FORM: TeamInput = {
  team_name: "",
  player1_name: "",
  player2_name: "",
  phone: "",
};

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
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center gap-4 px-5 text-center">
        <Image src="/mazaaj-logo-trimmed.png" alt="كافيه مزاج" width={150} height={122} priority />
        <h1 className="text-xl font-extrabold text-primary">لا توجد بطولة مفتوحة حالياً</h1>
        <p className="text-sm text-primary/60">
          تابعنا على حساباتنا لمعرفة موعد البطولة القادمة.
        </p>
      </main>
    );
  }

  const seatsLeft =
    tournament.max_teams !== null ? Math.max(0, tournament.max_teams - teamCount) : null;
  // الإغلاق إمّا لأن المهلة انتهت قبل فتح الصفحة أصلاً، أو لأن العدّاد وصل صفراً والصفحة
  // مفتوحة، أو لاكتمال العدد — والخادم يعيد التحقق من كل ذلك عند الإرسال على أي حال
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

  return (
    <main className="mx-auto w-full max-w-lg px-5 py-8 pb-16">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="mb-7 flex flex-col items-center gap-3 text-center"
      >
        <Image src="/mazaaj-logo-trimmed.png" alt="كافيه مزاج" width={130} height={106} priority />
        <span className="rounded-full bg-accent/15 px-4 py-1.5 text-xs font-bold text-accent">
          {tournament.category}
        </span>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-primary sm:text-3xl">
          <Trophy size={26} className="text-accent" />
          {tournament.title}
        </h1>
      </motion.div>

      <section className="mb-6">
        <p className="mb-2 text-center text-xs font-semibold text-primary/50">
          {closed ? "انتهى وقت التسجيل" : "ينتهي التسجيل خلال"}
        </p>
        {closed ? (
          <div className="rounded-2xl border border-primary/10 bg-primary/5 py-5 text-center">
            <p className="text-lg font-extrabold text-primary">
              {isFull && !deadlinePassed ? "اكتمل عدد الفرق" : "أُغلق باب التسجيل"}
            </p>
          </div>
        ) : (
          /* بلا dir="ltr" عمداً: بالاتجاه العربي تبدأ الخانات من اليمين فيُقرأ
             «يوم ← ساعة ← دقيقة ← ثانية» بترتيبه الطبيعي */
          <div className="flex gap-2">
            <CountdownBox value={remaining?.days ?? 0} label="يوم" />
            <CountdownBox value={remaining?.hours ?? 0} label="ساعة" />
            <CountdownBox value={remaining?.minutes ?? 0} label="دقيقة" />
            <CountdownBox value={remaining?.seconds ?? 0} label="ثانية" />
          </div>
        )}
      </section>

      <section className="mb-6 flex flex-col gap-3">
        <InfoCard
          icon={CalendarDays}
          label="موعد البطولة"
          value={formatTournamentDate(tournament.starts_at)}
        />
        <InfoCard
          icon={Coins}
          label="سعر الاشتراك"
          value={`${tournament.entry_fee.toLocaleString("en-US")} د.ع للفريق`}
        />
        <InfoCard
          icon={Users}
          label="الفرق المسجَّلة"
          value={
            seatsLeft === null
              ? `${teamCount.toLocaleString("en-US")} فريق`
              : `${teamCount.toLocaleString("en-US")} من ${tournament.max_teams!.toLocaleString("en-US")} — متبقٍ ${seatsLeft.toLocaleString("en-US")}`
          }
        />
        <div className="flex items-start gap-3 rounded-2xl border border-accent/25 bg-accent/10 p-4">
          <Wallet size={18} className="mt-0.5 shrink-0 text-accent" />
          <p className="text-xs leading-relaxed text-primary/70">
            التسجيل هنا <span className="font-bold text-primary">حجز فقط</span> — يُدفع
            الاشتراك نقداً في الكافيه.
          </p>
        </div>
      </section>

      {status === "success" ? (
        <section className="mb-8 flex flex-col items-center gap-2 rounded-3xl border border-green-500/30 bg-green-500/10 p-6 text-center">
          <CheckCircle2 size={36} className="text-green-600" />
          <h2 className="text-lg font-extrabold text-primary">تم تسجيل فريقك</h2>
          <p className="text-sm leading-relaxed text-primary/70">
            نراك يوم البطولة. تذكّر دفع الاشتراك{" "}
            <span className="font-bold text-primary">
              {tournament.entry_fee.toLocaleString("en-US")} د.ع
            </span>{" "}
            نقداً في الكافيه قبل بداية المباريات.
          </p>
        </section>
      ) : (
        !closed && (
          <section className="mb-8 rounded-3xl border border-primary/10 bg-background p-5 shadow-glass">
            <h2 className="mb-4 text-base font-extrabold text-primary">تسجيل فريق</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                required
                maxLength={60}
                value={form.team_name}
                onChange={(e) => setForm({ ...form, team_name: e.target.value })}
                placeholder="اسم الفريق"
                className="rounded-xl border border-primary/15 bg-background px-4 py-3 text-sm text-primary outline-none focus:border-accent"
              />
              <input
                required
                maxLength={60}
                value={form.player1_name}
                onChange={(e) => setForm({ ...form, player1_name: e.target.value })}
                placeholder="اسم اللاعب الأول"
                className="rounded-xl border border-primary/15 bg-background px-4 py-3 text-sm text-primary outline-none focus:border-accent"
              />
              <input
                required
                maxLength={60}
                value={form.player2_name}
                onChange={(e) => setForm({ ...form, player2_name: e.target.value })}
                placeholder="اسم اللاعب الثاني"
                className="rounded-xl border border-primary/15 bg-background px-4 py-3 text-sm text-primary outline-none focus:border-accent"
              />
              <input
                required
                type="tel"
                inputMode="tel"
                dir="ltr"
                maxLength={20}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="07XXXXXXXXX"
                className="rounded-xl border border-primary/15 bg-background px-4 py-3 text-start text-sm text-primary outline-none focus:border-accent"
              />

              {error && <p className="text-sm font-semibold text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="rounded-full bg-primary py-3.5 text-sm font-bold text-background disabled:opacity-50"
              >
                {status === "submitting" ? "جارِ التسجيل..." : "سجّل فريقي"}
              </button>
            </form>
          </section>
        )
      )}

      <section className="rounded-3xl border border-primary/10 bg-primary/[0.03] p-5">
        <h2 className="mb-4 text-base font-extrabold text-primary">قوانين البطولة</h2>
        <div className="flex flex-col gap-5">
          {TOURNAMENT_RULES.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 text-sm font-bold text-accent">{group.title}</h3>
              <ul className="flex flex-col gap-2">
                {group.items.map((item, i) => (
                  <li key={i} className="flex gap-2 text-xs leading-relaxed text-primary/70">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-8 text-center text-[11px] text-primary/40">© كافيه مزاج</p>
    </main>
  );
}
