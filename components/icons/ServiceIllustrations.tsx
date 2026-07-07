// رسومات خطية بسيطة (line-art) لبطاقات قسم "الخدمات" — مرسومة بالكود بدل صور جاهزة،
// تستخدم currentColor حتى تتلون تلقائياً حسب لون النص الممرر من العنصر الأب

export function WifiServiceIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" fill="none" className={className}>
      {/* أقواس الواي فاي */}
      <path d="M148 46a34 34 0 0 1 34 34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M148 58a22 22 0 0 1 22 22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="148" cy="88" r="4" fill="currentColor" />

      {/* الشخص */}
      <circle cx="70" cy="42" r="12" stroke="currentColor" strokeWidth="3" />
      <path
        d="M46 96c0-16 10-28 24-28s24 12 24 28"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* اللابتوب */}
      <path d="M40 108h60l-6 12H46l-6-12Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <rect x="48" y="86" width="44" height="22" rx="2" stroke="currentColor" strokeWidth="3" />

      {/* فنجان القهوة */}
      <path
        d="M116 96h26v10c0 8-6 14-14 14h-2c-8 0-10-6-10-14v-10Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M142 99h4a6 6 0 0 1 0 12h-4" stroke="currentColor" strokeWidth="3" />
      <path d="M124 88c0-3 3-3 3-6M132 88c0-3 3-3 3-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function PaymentServiceIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" fill="none" className={className}>
      {/* جهاز الدفع */}
      <rect x="104" y="52" width="46" height="60" rx="6" stroke="currentColor" strokeWidth="3" />
      <rect x="112" y="62" width="30" height="16" rx="2" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="118" cy="90" r="2.5" fill="currentColor" />
      <circle cx="127" cy="90" r="2.5" fill="currentColor" />
      <circle cx="136" cy="90" r="2.5" fill="currentColor" />
      <circle cx="118" cy="99" r="2.5" fill="currentColor" />
      <circle cx="127" cy="99" r="2.5" fill="currentColor" />
      <circle cx="136" cy="99" r="2.5" fill="currentColor" />

      {/* اليد والبطاقة */}
      <path
        d="M34 100c-4-10 2-24 14-28l40-14c5-2 10 1 12 6s-1 10-6 12l-26 9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="60" y="46" width="34" height="22" rx="3"
        transform="rotate(-20 60 46)"
        stroke="currentColor"
        strokeWidth="3"
      />

      {/* فنجان القهوة */}
      <path
        d="M26 110h24v8c0 7-5 12-12 12s-12-5-12-12v-8Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M50 113h4a5 5 0 0 1 0 10h-4" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

export function IraqiVibeServiceIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" fill="none" className={className}>
      {/* واجهة المقهى */}
      <path d="M50 40h100l8 16H42l8-16Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M46 56h108v6H46z" stroke="currentColor" strokeWidth="2.5" />
      <path d="M60 62v14M84 62v14M108 62v14M132 62v14M146 62v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

      {/* الطاولة والكرسيين */}
      <ellipse cx="100" cy="112" rx="22" ry="6" stroke="currentColor" strokeWidth="2.5" />
      <path d="M100 96v10" stroke="currentColor" strokeWidth="2.5" />

      {/* الشخص الأول */}
      <circle cx="66" cy="84" r="9" stroke="currentColor" strokeWidth="3" />
      <path d="M50 118c0-13 7-22 16-22s16 9 16 22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

      {/* الشخص الثاني */}
      <circle cx="134" cy="84" r="9" stroke="currentColor" strokeWidth="3" />
      <path d="M118 118c0-13 7-22 16-22s16 9 16 22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

      {/* فناجين على الطاولة */}
      <path d="M92 104h8v4c0 3-2 5-4 5s-4-2-4-5v-4Z" stroke="currentColor" strokeWidth="2" />
      <path d="M100 104h8v4c0 3-2 5-4 5s-4-2-4-5v-4Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function MeetingServiceIllustration({ className }: { className?: string }) {
  const seats = [
    { cx: 100, cy: 40 },
    { cx: 60, cy: 62 },
    { cx: 140, cy: 62 },
    { cx: 72, cy: 108 },
    { cx: 128, cy: 108 },
  ];
  return (
    <svg viewBox="0 0 200 140" fill="none" className={className}>
      <ellipse cx="100" cy="80" rx="36" ry="24" stroke="currentColor" strokeWidth="3" />
      {seats.map((s, i) => (
        <g key={i}>
          <circle cx={s.cx} cy={s.cy - 12} r="7" stroke="currentColor" strokeWidth="2.5" />
          <path
            d={`M${s.cx - 10} ${s.cy + 6}c0-9 5-15 10-15s10 6 10 15`}
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
      ))}
      <circle cx="90" cy="80" r="3" fill="currentColor" />
      <circle cx="110" cy="80" r="3" fill="currentColor" />
    </svg>
  );
}
