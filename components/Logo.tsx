import Image from "next/image";

export default function Logo({
  height = 36,
  className = "",
  priority = false,
}: {
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/mazaaj-logo-trimmed.png"
      alt="mazaaj"
      width={Math.round(height * 1.23)}
      height={height}
      priority={priority}
      className={`h-full w-auto object-contain ${className}`}
      style={{ height }}
    />
  );
}
