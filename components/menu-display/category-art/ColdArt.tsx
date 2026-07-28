type ColdArtProps = {
  size?: number;
  className?: string;
};

// كوب طويل بمكعبات ثلج هندسية وغصن نعناع/حمضيات — للأقسام الباردة
// (قهوة باردة/فرابتشينو/ميلك شيك/موهيتو/سموذي/عصائر/غازيات)
export default function ColdArt({ size = 64, className = "" }: ColdArtProps) {
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
      <ellipse cx="50" cy="86" rx="26" ry="5" opacity="0.35" />
      <path
        d="M34 28h32l-4 52a4 4 0 0 1-4 4H42a4 4 0 0 1-4-4L34 28z"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <path d="M40 22h20" opacity="0.7" />
      <rect x="44" y="42" width="10" height="10" transform="rotate(20 49 47)" opacity="0.6" />
      <rect x="52" y="56" width="9" height="9" transform="rotate(-12 56 60)" opacity="0.5" />
      <path d="M64 24l6-10" opacity="0.7" />
      <path d="M22 46c6 2 8 8 6 14-2 5-1 9 3 12" opacity="0.5" />
    </svg>
  );
}
