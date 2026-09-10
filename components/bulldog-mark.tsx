"use client";

import { BULLDOG_SRC } from "@/lib/pin-meta";
import { cn } from "cn";

export function BulldogMark({
  className,
  title = "Bulldog",
}: {
  className?: string;
  title?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BULLDOG_SRC}
      alt={title}
      draggable={false}
      className={cn("inline-block size-5 shrink-0 object-contain", className)}
    />
  );
}
