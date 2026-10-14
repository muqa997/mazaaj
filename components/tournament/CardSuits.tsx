// رموز الورق الأربعة كأيقونات خطّية — تُستخدم شارةً صغيرة أعلى البطاقات وعلامةً مائية
// باهتة بالخلفيات. مرسومة بـSVG لا بالرموز النصية (♠♥♦♣)، لأن أنظمة كثيرة تعرض تلك
// الرموز كإيموجي ملوّن فيكسر مظهر التصميم

type SuitProps = { size?: number; className?: string };

export function Spade({ size = 24, className }: SuitProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2C9 6 3 8.5 3 13a4.5 4.5 0 0 0 7.5 3.3c-.2 2-.9 3.4-2 4.7h7c-1.1-1.3-1.8-2.7-2-4.7A4.5 4.5 0 0 0 21 13c0-4.5-6-7-9-11z" />
    </svg>
  );
}

export function Heart({ size = 24, className }: SuitProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 21s-7.5-4.7-9.3-9.2C1.3 8.1 3.4 4.5 7 4.5c2 0 3.6 1 5 2.6 1.4-1.6 3-2.6 5-2.6 3.6 0 5.7 3.6 4.3 7.3C19.5 16.3 12 21 12 21z" />
    </svg>
  );
}

export function Diamond({ size = 24, className }: SuitProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2 21 12 12 22 3 12z" />
    </svg>
  );
}

export function Club({ size = 24, className }: SuitProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="12" cy="7" r="4" />
      <circle cx="7.2" cy="13.6" r="4" />
      <circle cx="16.8" cy="13.6" r="4" />
      <path d="M10.4 15.6c.5 2.4-.1 4.1-1.4 5.6h6c-1.3-1.5-1.9-3.2-1.4-5.6z" />
    </svg>
  );
}

/** صف الرموز الأربعة بين خطّين رفيعين — توقيع بصري متكرر عبر صفحات البطولة */
export function SuitRow({ size = 16, className = "" }: SuitProps) {
  return (
    <span className={`flex items-center gap-3 ${className}`} aria-hidden="true">
      <Spade size={size} />
      <Heart size={size} />
      <Diamond size={size} />
      <Club size={size} />
    </span>
  );
}
