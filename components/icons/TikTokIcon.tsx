export default function TikTokIcon({
  size = 16,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M16.6 5.82c-1.06-.98-1.66-2.36-1.66-3.82h-3.13v13.94c0 1.55-1.26 2.81-2.81 2.81a2.81 2.81 0 0 1-2.81-2.81 2.81 2.81 0 0 1 2.81-2.81c.29 0 .57.04.83.13v-3.19a6 6 0 0 0-.83-.06 6 6 0 0 0-6 6 6 6 0 0 0 6 6 6 6 0 0 0 6-6V9.4a8.5 8.5 0 0 0 4.94 1.58V7.85a5.06 5.06 0 0 1-3.34-2.03z" />
    </svg>
  );
}
