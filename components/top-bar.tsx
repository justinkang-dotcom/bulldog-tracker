"use client";

import { RadioIcon } from "lucide-react";

type Props = {
  liveCount: number;
  status: "loading" | "ready" | "error";
};

export function TopBar({ liveCount, status }: Props) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-[1200] bg-linear-to-b from-[#07080c] via-[#07080c]/75 to-transparent px-4 pb-10 pt-[max(0.85rem,env(safe-area-inset-top))]">
      <div className="pointer-events-auto mx-auto flex max-w-lg items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full border border-signal/40 bg-signal/15">
              <span className="size-2 rounded-full bg-signal shadow-[0_0_12px_#4c9be8]" />
            </span>
            <h1 className="font-[family-name:var(--font-display)] text-[1.7rem] font-extrabold leading-none tracking-tight text-[#f3ead8] sm:text-3xl">
              Bulldog Tracker
            </h1>
          </div>
          <p className="mt-1 max-w-[16rem] text-sm text-zinc-400">
            What&apos;s popping on campus right now
          </p>
          <p className="mt-2 text-[10px] tracking-wide text-zinc-600">
            Map © OpenStreetMap
          </p>
        </div>
        <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#10131b]/80 px-2.5 py-1 text-xs text-zinc-300 backdrop-blur-md">
          <RadioIcon className="size-3.5 text-signal" />
          {status === "loading" && liveCount === 0
            ? "Locking on…"
            : `${liveCount} live`}
        </div>
      </div>
    </header>
  );
}
