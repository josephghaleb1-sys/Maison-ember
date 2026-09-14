import Image from "next/image";
import { ImageOff } from "lucide-react";
import { getPublicMediaUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

export function Thumb({
  path,
  alt,
  className,
  size = 48,
}: {
  path: string | null;
  alt: string;
  className?: string;
  size?: number;
}) {
  if (!path) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg bg-ink-800 text-ink-300",
          className,
        )}
        style={{ width: size, height: size }}
      >
        <ImageOff className="size-1/2" aria-hidden />
      </div>
    );
  }

  return (
    <div
      className={cn("relative shrink-0 overflow-hidden rounded-lg bg-ink-800", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={getPublicMediaUrl(path)}
        alt={alt}
        fill
        sizes={`${size}px`}
        className="object-cover"
      />
    </div>
  );
}
