// حسابات شجرة القرعة — ملف خالٍ من أي استيراد، تستورده مكوّنات الواجهة مباشرة

export type DrawMatch = {
  /** رقم المباراة كما يظهر على الشاشة (يبدأ من 1) */
  number: number;
  /** الفريقان: null يعني خانة لم تُسحَب بعد */
  teams: [string | null, string | null];
  /** مباراة بفريق واحد: يتأهل صاحبها للدور التالي بلا لعب */
  isBye: boolean;
};

/** موضع خانة واحدة بالشجرة — ترتيب هذه القائمة هو ترتيب السحب */
export type SlotRef = { match: number; side: 0 | 1 };

/** أصغر قوة للعدد 2 تتسع لكل الفرق: 6 فرق ← 8، و12 ← 16، و20 ← 32 */
export function bracketSizeFor(teamCount: number): number {
  if (teamCount < 2) return 2;
  return 2 ** Math.ceil(Math.log2(teamCount));
}

/**
 * يبني مباريات الدور الأول لعدد فرق معيّن.
 *
 * حين لا يكون العدد قوةً للرقم 2 تبقى خانات فارغة، وصاحب الخانة الفارغة يتأهل
 * **لدور واحد فقط** لا للنهائي. وتُوزَّع هذه المقاعد على طول الشجرة بالتساوي بدل
 * تكديسها بآخرها، وإلا لخرج نصف الشجرة أخفّ من نصفها الآخر.
 *
 * القرار يُتَّخذ **قبل** بدء السحب ويظهر على الشاشة، فلا يمكن توجيهه لفريق بعينه.
 */
export function buildMatches(teamCount: number): DrawMatch[] {
  const size = bracketSizeFor(teamCount);
  const pairs = size / 2;
  const byes = Math.max(0, size - teamCount);

  // byes أقل من pairs دائماً، فالقسمة تعطي مواضع متصاعدة بلا تكرار
  const byePairs = new Set<number>();
  for (let i = 0; i < byes; i += 1) {
    byePairs.add(Math.floor((i * pairs) / byes));
  }

  return Array.from({ length: pairs }, (_, i) => ({
    number: i + 1,
    teams: [null, null] as [string | null, string | null],
    isBye: byePairs.has(i),
  }));
}

/** ترتيب السحب: من المباراة الأولى إلى الأخيرة، والخانة اليمنى قبل اليسرى */
export function slotOrder(matches: DrawMatch[]): SlotRef[] {
  const slots: SlotRef[] = [];
  for (const match of matches) {
    slots.push({ match: match.number, side: 0 });
    if (!match.isBye) slots.push({ match: match.number, side: 1 });
  }
  return slots;
}

/** اسم الدور حسب عدد الفرق الداخلة فيه */
export function roundName(teamsInRound: number): string {
  if (teamsInRound <= 2) return "النهائي";
  if (teamsInRound === 4) return "نصف النهائي";
  if (teamsInRound === 8) return "ربع النهائي";
  return `دور الـ${teamsInRound.toLocaleString("en-US")}`;
}

/** أسماء الأدوار من الدور الأول حتى النهائي */
export function roundNames(teamCount: number): string[] {
  const size = bracketSizeFor(teamCount);
  const names: string[] = [];
  for (let n = size; n >= 2; n /= 2) names.push(roundName(n));
  return names;
}

/**
 * اختيار عشوائي حقيقي من مولّد المتصفح المعمّى، لا Math.random.
 * القرعة توزّع اشتراكات مدفوعة، فيجب ألا تكون النتيجة قابلة للتوقع أو التوجيه.
 */
export function pickRandomIndex(length: number): number {
  if (length <= 0) return -1;
  if (length === 1) return 0;

  const crypto = globalThis.crypto;
  if (!crypto?.getRandomValues) return Math.floor(Math.random() * length);

  // رفض القيم التي تقع خارج أكبر مضاعف كامل للطول، وإلا مالت النتيجة للأرقام الصغيرة
  const limit = Math.floor(0xffffffff / length) * length;
  const buf = new Uint32Array(1);
  let value = 0;
  do {
    crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);

  return value % length;
}

/** خلط عادل (Fisher–Yates) بنفس المولّد المعمّى */
export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = pickRandomIndex(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** ألوان قطاعات العجلة: تباعد بالزاوية الذهبية فتتمايز المتجاورات مهما كثرت */
export function wheelColor(index: number, total: number): string {
  const hue = (index * 137.508) % 360;
  // تفتيح/تغميق متناوب يضمن حدّاً واضحاً بين كل قطاعين متجاورين
  const light = index % 2 === 0 ? 44 : 34;
  return `hsl(${hue.toFixed(1)} 52% ${total > 20 ? light - 4 : light}%)`;
}
