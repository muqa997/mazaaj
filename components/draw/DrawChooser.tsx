"use client";

import { PencilLine, Shuffle } from "lucide-react";

type DrawChooserProps = {
  onPick: (mode: "wheel" | "manual") => void;
};

const CARDS = [
  {
    mode: "wheel" as const,
    icon: Shuffle,
    title: "القرعة بالعجلة",
    line: "تُدار أمام الحضور",
    points: [
      "تضيف الفرق أو تسحبها من المشتركين",
      "ضغطة واحدة وتكمل القرعة وحدها",
      "العجلة توزّع الفرق على الشجرة بالترتيب",
    ],
  },
  {
    mode: "manual" as const,
    icon: PencilLine,
    title: "القرعة اليدوية",
    line: "تكتب الأسماء بنفسك",
    points: [
      "تختار عدد الفرق فتُرسم الشجرة فوراً",
      "تكتب كل اسم في خانته مباشرة",
      "الفائز بضغطة، أو بالعجلة لكل مباراة",
    ],
  },
];

/** بطاقتا القرعة — تظهران بعد الرمز، فيختار المدير طريقته قبل أن تُفتح الشاشة */
export default function DrawChooser({ onPick }: DrawChooserProps) {
  return (
    <div className="mx-auto w-full max-w-3xl py-6">
      <h2 className="text-lg font-black text-primary">شاشة القرعة</h2>
      <p className="mt-1 text-xs text-primary/50">
        اختر الطريقة — القرعتان محفوظتان كلٌّ على حدة، فلا تمسح إحداهما الأخرى
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <button
            key={card.mode}
            type="button"
            onClick={() => onPick(card.mode)}
            className="flex flex-col gap-4 rounded-3xl border border-primary/10 bg-background p-5 text-start shadow-glass transition-transform active:scale-[0.99]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/20">
              <card.icon size={22} className="text-primary" />
            </span>

            <span>
              <span className="block text-base font-black text-primary">{card.title}</span>
              <span className="mt-0.5 block text-xs font-bold text-primary/45">{card.line}</span>
            </span>

            <ul className="flex flex-col gap-2 border-t border-primary/[0.07] pt-3">
              {card.points.map((point) => (
                <li key={point} className="flex gap-2 text-[12.5px] leading-relaxed text-primary/65">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent" />
                  {point}
                </li>
              ))}
            </ul>

            <span className="mt-auto flex min-h-[44px] items-center justify-center rounded-2xl bg-primary text-sm font-black text-background">
              فتح
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
