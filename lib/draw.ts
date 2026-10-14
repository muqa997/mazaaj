// بناء شجرة البطولة وحسابات القرعة — ملف خالٍ من أي استيراد، تستورده الواجهة مباشرة

export type MatchSlot = {
  team: string | null;
  /** إن كانت الخانة محجوزة لفائز مباراة سابقة، فهذا رقمها */
  fromMatch: number | null;
};

export type BracketMatch = {
  id: number;
  round: number;
  slots: [MatchSlot, MatchSlot];
  winner: string | null;
};

export type BracketRound = {
  name: string;
  matchIds: number[];
};

export type Bracket = {
  matches: BracketMatch[];
  rounds: BracketRound[];
  /** ترتيب خانات السحب: من أول مباراة إلى آخرها */
  drawSlots: { matchId: number; side: 0 | 1 }[];
};

export type SlotRef = { matchId: number; side: 0 | 1 };

const isPowerOfTwo = (n: number) => n >= 2 && (n & (n - 1)) === 0;

/** اسم الدور حسب عدد الفرق الداخلة فيه */
export function roundName(teamsInRound: number): string {
  if (teamsInRound <= 2) return "النهائي";
  if (teamsInRound === 4) return "نصف النهائي";
  if (teamsInRound === 8) return "ربع النهائي";
  return `دور الـ${teamsInRound.toLocaleString("en-US")}`;
}

// العربية تُفرد وتُثنّي ثم تجمع، والتمييز يُنصب من 11 فما فوق. بدون هذا تخرج عبارات
// مثل «2 مباريات» و«14 فرق» على شاشة أمام الحضور
function countPhrase(n: number, one: string, two: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n === 2) return two;
  if (n <= 10) return `${n.toLocaleString("en-US")} ${few}`;
  return `${n.toLocaleString("en-US")} ${many}`;
}

const matchesPhrase = (n: number) => countPhrase(n, "مباراة واحدة", "مباراتان", "مباريات", "مباراة");
// صيغة المثنى بعد حرف الجر تُجَرّ: «بين فريقين» لا «بين فريقان»
const teamsGen = (n: number) => countPhrase(n, "فريق واحد", "فريقين", "فرق", "فريقاً");

/**
 * يصف شكل البطولة بالكلمات قبل بدء القرعة، ليعرف المدير ما الذي سيحدث.
 */
export function describeFormat(teamCount: number): string {
  if (teamCount < 2) return "";
  const { mainSize, prelimMatches } = planShape(teamCount);

  if (prelimMatches === 0) {
    return `${roundName(mainSize)} مباشرةً — ${matchesPhrase(mainSize / 2)}`;
  }

  const direct = mainSize - prelimMatches;
  return `دور تمهيدي: ${matchesPhrase(prelimMatches)} بين ${teamsGen(prelimMatches * 2)} — ${
    prelimMatches === 1 ? "الفائز يكمل" : "الفائزون يكملون"
  } ${roundName(mainSize)} مع ${teamsGen(direct)}`;
}

/**
 * شكل البطولة: كم فريقاً يدخل الشجرة الرئيسية، وكم مباراة تمهيدية قبلها.
 *
 * هذه هي الطريقة الصحيحة لعدد فرق ليس قوةً للرقم 2. الخطأ الشائع — وهو ما كان هنا —
 * أن تُقرَّب الشجرة **للأعلى** فتصير 9 فرق شجرةَ 16 فيها 7 مقاعد تأهل مباشر ومباراة
 * واحدة حقيقية. الصحيح أن تُقرَّب **للأسفل**: شجرة من 8، ويلعب الفائض دوراً تمهيدياً
 * قصيراً ليكتمل العدد — فيلعب الجميع تقريباً، ولا يُهدى أحد نصف البطولة.
 */
export function planShape(teamCount: number): { mainSize: number; prelimMatches: number } {
  if (teamCount < 2) return { mainSize: 2, prelimMatches: 0 };
  if (isPowerOfTwo(teamCount)) return { mainSize: teamCount, prelimMatches: 0 };

  const mainSize = 2 ** Math.floor(Math.log2(teamCount));
  // كل مباراة تمهيدية تبتلع فريقين وتُخرج واحداً، فعددها = الفائض عن الشجرة
  return { mainSize, prelimMatches: teamCount - mainSize };
}

/** يبني الشجرة كاملة من الدور التمهيدي حتى النهائي */
export function buildBracket(teamCount: number): Bracket {
  const matches: BracketMatch[] = [];
  const rounds: BracketRound[] = [];
  if (teamCount < 2) return { matches, rounds, drawSlots: [] };

  const { mainSize, prelimMatches } = planShape(teamCount);
  let nextId = 0;

  const emptySlots = (): [MatchSlot, MatchSlot] => [
    { team: null, fromMatch: null },
    { team: null, fromMatch: null },
  ];

  const addRound = (name: string, count: number, round: number) => {
    const ids: number[] = [];
    for (let i = 0; i < count; i += 1) {
      matches.push({ id: nextId, round, slots: emptySlots(), winner: null });
      ids.push(nextId);
      nextId += 1;
    }
    rounds.push({ name, matchIds: ids });
    return ids;
  };

  let roundIndex = 0;
  const prelimIds =
    prelimMatches > 0 ? addRound("الدور التمهيدي", prelimMatches, roundIndex++) : [];

  // أدوار الشجرة الرئيسية حتى النهائي
  const mainRoundIds: number[][] = [];
  for (let size = mainSize; size >= 2; size /= 2) {
    mainRoundIds.push(addRound(roundName(size), size / 2, roundIndex++));
  }

  // وصل كل دور بالذي قبله: فائز المباراة يملأ خانة بالدور التالي
  for (let r = 1; r < mainRoundIds.length; r += 1) {
    mainRoundIds[r].forEach((id, i) => {
      matches[id].slots[0].fromMatch = mainRoundIds[r - 1][i * 2];
      matches[id].slots[1].fromMatch = mainRoundIds[r - 1][i * 2 + 1];
    });
  }

  // فائزو التمهيدي يدخلون الدور الأول. نوزّعهم على الخانة الثانية من كل مباراة أولاً،
  // فيواجه كلٌّ منهم فريقاً متأهلاً مباشرة ما دام ذلك ممكناً، بدل أن يصطدم تمهيديان
  if (prelimIds.length > 0) {
    const firstRound = mainRoundIds[0];
    const targets: SlotRef[] = [
      ...firstRound.map((matchId) => ({ matchId, side: 1 as const })),
      ...firstRound.map((matchId) => ({ matchId, side: 0 as const })),
    ];
    prelimIds.forEach((prelimId, i) => {
      const target = targets[i];
      matches[target.matchId].slots[target.side].fromMatch = prelimId;
    });
  }

  // ترتيب السحب: التمهيدي كاملاً، ثم الخانات الحرة بالدور الأول
  const drawSlots: SlotRef[] = [];
  for (const id of prelimIds) {
    drawSlots.push({ matchId: id, side: 0 }, { matchId: id, side: 1 });
  }
  for (const id of mainRoundIds[0]) {
    ([0, 1] as const).forEach((side) => {
      if (matches[id].slots[side].fromMatch === null) drawSlots.push({ matchId: id, side });
    });
  }

  return { matches, rounds, drawSlots };
}

/** عدد الخانات المملوءة بالسحب حتى الآن */
export function countDrawn(bracket: Bracket): number {
  return bracket.drawSlots.filter(
    ({ matchId, side }) => bracket.matches[matchId].slots[side].team !== null
  ).length;
}

/** يضع فريقاً بالخانة التالية بالترتيب ويُرجع شجرة جديدة */
export function placeTeam(bracket: Bracket, team: string): Bracket {
  const slot = bracket.drawSlots[countDrawn(bracket)];
  if (!slot) return bracket;

  const matches = bracket.matches.map((m) =>
    m.id === slot.matchId
      ? {
          ...m,
          slots: m.slots.map((s, i) => (i === slot.side ? { ...s, team } : s)) as [
            MatchSlot,
            MatchSlot,
          ],
        }
      : m
  );
  return { ...bracket, matches };
}

/**
 * يثبّت فائز مباراة ويُصعِّده للدور التالي.
 *
 * تغيير فائز مباراة قديمة يمسح كل ما بُني عليه بالأدوار اللاحقة — وإلا بقي فريق خاسر
 * صاعداً في نصف الشجرة بلا أن ينتبه أحد
 */
export function setWinner(bracket: Bracket, matchId: number, team: string | null): Bracket {
  const matches = bracket.matches.map((m) => ({ ...m, slots: [...m.slots] as [MatchSlot, MatchSlot] }));

  const clearDownstream = (fromId: number) => {
    for (const m of matches) {
      ([0, 1] as const).forEach((side) => {
        if (m.slots[side].fromMatch === fromId && m.slots[side].team !== null) {
          m.slots[side] = { ...m.slots[side], team: null };
          if (m.winner !== null) {
            m.winner = null;
            clearDownstream(m.id);
          }
        }
      });
    }
  };

  const match = matches[matchId];
  if (!match) return bracket;
  match.winner = team;
  clearDownstream(matchId);

  if (team !== null) {
    for (const m of matches) {
      ([0, 1] as const).forEach((side) => {
        if (m.slots[side].fromMatch === matchId) {
          m.slots[side] = { ...m.slots[side], team };
        }
      });
    }
  }

  return { ...bracket, matches };
}

/** المباراة جاهزة للعب حين يكون طرفاها معروفين */
export const isPlayable = (match: BracketMatch) =>
  match.slots[0].team !== null && match.slots[1].team !== null;

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

/** ألوان قطاعات العجلة: تباعد بالزاوية الذهبية فتتمايز المتجاورات مهما كثرت */
export function wheelColor(index: number, total: number): string {
  const hue = (index * 137.508) % 360;
  // تفتيح/تغميق متناوب يضمن حدّاً واضحاً بين كل قطاعين متجاورين
  const light = index % 2 === 0 ? 44 : 34;
  return `hsl(${hue.toFixed(1)} 52% ${total > 20 ? light - 4 : light}%)`;
}
