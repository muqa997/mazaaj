// أنواع بطولات الورق وقوانينها — هذا الملف خالٍ من أي استيراد خادمي عمداً، لأن
// مكوّنات الواجهة (client components) تستورد منه القوانين والأنواع. قراءة البيانات
// من Supabase موجودة بملف منفصل: lib/tournaments-server.ts

export type TournamentRow = {
  id: string;
  title: string;
  category: string;
  starts_at: string;
  registration_closes_at: string;
  entry_fee: number;
  max_teams: number | null;
  is_active: boolean;
  created_at: string;
  // يملؤه trigger بقاعدة البيانات تلقائياً عند كل تعديل. قد يكون غائباً بالصفوف
  // القديمة التي أُنشئت قبل إضافة العمود
  updated_at?: string | null;
};

// تبقى البطولة معروضة ٦ ساعات بعد موعد بدايتها (تكفي ليلة البطولة كاملة)، ثم تختفي
// من الموقع وحدها. بدون هذا كانت البطولة المنتهية تبقى معروضة للأبد، والأسوأ: تمنع
// أي بطولة جديدة من الظهور لأن موعدها أقدم — وهذا سبب "أضفت بطولة ولم تتحدث الصفحة"
export const TOURNAMENT_VISIBLE_HOURS_AFTER_START = 6;

/**
 * كل البطولات التي يعرضها الموقع: المفعّلة التي لم ينتهِ موعدها، مرتّبة بالأقرب موعداً.
 * عند تساوي الموعد تتقدّم الأحدث إنشاءً.
 *
 * هذه الدالة هي **المرجع الوحيد**: الصفحة الرئيسية وصفحة البطولات ولوحة التحكم كلها
 * تستدعيها، فما تُعلّمه اللوحة "معروضة بالموقع" هو بالضبط ما يراه الزائر.
 */
export function listLiveTournaments<T extends TournamentRow>(tournaments: T[]): T[] {
  const cutoff = Date.now() - TOURNAMENT_VISIBLE_HOURS_AFTER_START * 60 * 60 * 1000;

  return tournaments
    .filter((t) => t.is_active && new Date(t.starts_at).getTime() >= cutoff)
    .sort((a, b) => {
      const byStart = new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
      if (byStart !== 0) return byStart;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
}

/**
 * بطولتان تحملان نفس العنوان ونفس موعد البداية — غالباً نسخة مكرّرة بالخطأ. نُنبّه
 * المدير إليها لأن المشتركين سينقسمون بينهما بلا أن ينتبه أحد
 */
export function findDuplicateTournaments<T extends TournamentRow>(tournaments: T[]): T[] {
  const live = listLiveTournaments(tournaments);
  const seen = new Map<string, T[]>();
  for (const t of live) {
    const key = `${t.title.trim()}|${t.starts_at}`;
    seen.set(key, [...(seen.get(key) ?? []), t]);
  }
  return [...seen.values()].filter((group) => group.length > 1).flat();
}

export const registrationOpen = (t: TournamentRow) =>
  new Date(t.registration_closes_at) > new Date();

// لا يوجد "اسم فريق" — الفريق يُعرَّف باسمي لاعبيه فقط
export type TournamentTeamRow = {
  id: string;
  tournament_id: string;
  player1_name: string;
  player2_name: string;
  phone: string;
  created_at: string;
};

export type TournamentInput = {
  title: string;
  category: string;
  starts_at: string;
  registration_closes_at: string;
  entry_fee: number;
  max_teams: number | null;
  is_active: boolean;
};

export type TeamInput = {
  player1_name: string;
  player2_name: string;
  phone: string;
};

export const teamLabel = (team: { player1_name: string; player2_name: string }) =>
  `${team.player1_name} و ${team.player2_name}`;

// قوانين اللعبة كما أملاها صاحب الكافيه — تظهر أسفل صفحة البطولة للمشتركين
export const TOURNAMENT_RULES: { title: string; items: string[] }[] = [
  {
    title: "النزول",
    items: [
      "النزول يبدأ من ٧١ نقطة، والبطولة «تصاعدي خبيثة»: إذا نزل فريق بـ٧١ نقطة، فعلى فريق الخصم أن ينزل بأكثر من نزول الفريق الأول.",
      "«يفك صاحبه» — من ينزل بأكثر من نزول فريق الخصم أو بأكثر من نزول شريكه، يُحرّر شريكه في الفريق: فيصبح بإمكان الشريك النزول بـ٧١ نقطة فما فوق، حتى لو كان نزول الخصم أو نزول شريكه أعلى منها.",
    ],
  },
  {
    title: "النقاط",
    items: [
      "بدون هاند — الفريق الذي يفوز بالهاند (يُكمل أوراقه كلها دفعة واحدة) يأخذ ٢٠٠ نقطة فقط، لا ٣٠٠ ولا ٤٠٠.",
      "الكونكان الداخلي — ٦٠٠ نقطة فقط.",
    ],
  },
  {
    title: "السحب والجوكر",
    items: [
      "عند صعود فريق الخصم كونكان، لا يحق للفريق المقابل السحب أو الاستفادة من الورق من الأرض — فقط ورقة الخلاص.",
      "الجوكر — يُسحب عند قص الورق بورقة واحدة فقط، وليس ورقتين.",
    ],
  },
  {
    title: "الحساب",
    items: ["البطولة ١٠ جولات، والجولة الحادية عشرة للحساب."],
  },
  {
    title: "المخالفات والعقوبات",
    items: [
      "التجميد — يُجمَّد اللاعب إذا سحب ورقة زائدة، أو أخطأ في النزول، أو أخطأ في عدّ نقاطه.",
      "الغش ممنوع منعاً باتاً، والكلام أو التلميح مع الشريك ممنوع — عقوبة أيٍّ منهما: خصم ٢٠٠ نقطة من الفريق.",
    ],
  },
];

// أرقام الموبايل العراقية تُكتب بصيغ مختلفة (٠٧٧٠… / ٩٦٤٧٧٠… / بفواصل ومسافات)، فنوحّدها
// لصيغة واحدة ٠٧XXXXXXXXX قبل الحفظ ليسهل على المدير الاتصال بها ومقارنتها
export function normalizeIraqiPhone(raw: string): string | null {
  const digits = raw
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/\D/g, "");

  const local = digits.startsWith("964")
    ? `0${digits.slice(3)}`
    : digits.startsWith("00964")
      ? `0${digits.slice(5)}`
      : digits;

  return /^07\d{9}$/.test(local) ? local : null;
}

export function formatTournamentDate(iso: string): string {
  // ar-IQ وحدها تعطي أرقاماً هندية (٢٠٢٦)، بينما بقية أرقام الموقع لاتينية
  // (10,000) — فيختلط النظامان بالبطاقة الواحدة. اللاحقة u-nu-latn تُبقي أسماء الأيام
  // والشهور بالعربية والأرقام لاتينية
  return new Date(iso).toLocaleString("ar-IQ-u-nu-latn", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
