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
};

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
  return new Date(iso).toLocaleString("ar-IQ", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
