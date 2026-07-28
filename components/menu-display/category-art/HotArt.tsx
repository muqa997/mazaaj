type HotArtProps = {
  size?: number;
  className?: string;
};

// سيلويت فنجان قهوة على صحن — للأقسام الساخنة (قهوة سادة/ساخنة/شاي/هوت شوكليت)
export default function HotArt({ size = 64, className = "" }: HotArtProps) {
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
      <ellipse cx="50" cy="78" rx="30" ry="6" opacity="0.35" />
      <path
        d="M28 44h38v20a19 19 0 0 1-19 19 19 19 0 0 1-19-19V44z"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path d="M66 50h6a9 9 0 0 1 0 18h-6" />
      <path d="M38 30c-2 3-2 5 0 8M50 30c-2 3-2 5 0 8M62 30c-2 3-2 5 0 8" opacity="0.55" />
    </svg>
  );
}
