import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
        <Image
          src="/logo.png"
          alt="mazaaj"
          width={36}
          height={36}
          className="rounded-full"
        />
      </div>
    </div>
  );
}
