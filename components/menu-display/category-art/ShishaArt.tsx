type ShishaArtProps = {
  size?: number;
  className?: string;
};

// سيلويت أركيلة (قاعدة + جذع + رأس) مع منحنيات دخان ثابتة — لقسم الأراجيل
export default function ShishaArt({ size = 64, className = "" }: ShishaArtProps) {
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
      <path
        d="M50 52c-10 6-14 14-10 22 3 6 10 9 10 9s7-3 10-9c4-8 0-16-10-22z"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path d="M50 52c-10 6-14 14-10 22 3 6 10 9 10 9s7-3 10-9c4-8 0-16-10-22z" />
      <path d="M50 52V22" />
      <ellipse cx="50" cy="20" rx="9" ry="4" />
      <path d="M35 83h30" opacity="0.6" />
      <path d="M60 60c6 2 10 6 8 10-2 3 0 6 4 6" opacity="0.55" />
      <path d="M36 30c-2 3-2 5 0 8M46 26c-2 3-2 5 0 8" opacity="0.5" />
    </svg>
  );
}
