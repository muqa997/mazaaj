type DessertsArtProps = {
  size?: number;
  className?: string;
};

// طبق كريب/وافل بدوامة كريمة — لأقسام الحلويات الأربعة (كريب/حلى بارد/كريب رول/وافل)
export default function DessertsArt({ size = 64, className = "" }: DessertsArtProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <ellipse
        cx="50"
        cy="62"
        rx="34"
        ry="14"
        fill="currentColor"
        fillOpacity="0.08"
      />
      <ellipse cx="50" cy="62" rx="34" ry="14" />
      <path d="M32 56c8-16 28-16 36 0" fill="currentColor" fillOpacity="0.14" />
      <path d="M43 36c2 4 2 6-1 9M50 33c2 4 2 6-1 9M57 36c2 4 2 6-1 9" opacity="0.55" />
      <circle cx="50" cy="30" r="3" fill="currentColor" fillOpacity="0.7" stroke="none" />
    </svg>
  );
}
