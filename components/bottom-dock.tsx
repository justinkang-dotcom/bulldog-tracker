"use client";

import { computeHeat, sortByHeat } from "@/lib/heat";
import { formatTimeLeft } from "@/lib/format";
import { TYPE_META } from "@/lib/pin-meta";
import { PIN_TYPES, type PinType, type PublicPin } from "@/lib/types";
import { BulldogMark } from "@/components/bulldog-mark";
import { CrosshairIcon, MinusIcon, PlusIcon } from "lucide-react";

export type DockChrome = "browse" | "confirm" | "hidden";

type Props = {
  pins: PublicPin[];
  now: number;
  filter: PinType | "all";
  onFilter: (filter: PinType | "all") => void;
  chrome: DockChrome;
  onConfirmDrop: () => void;
  onToggleDrop: () => void;
  onSelect: (id: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  liveCount: number;
};

export function BottomDock({
  pins,
  now,
  filter,
  onFilter,
  chrome,
  onConfirmDrop,
  onToggleDrop,
  onSelect,
  onZoomIn,
  onZoomOut,
  liveCount,
}: Props) {
  const ranked = sortByHeat(pins, now).slice(0, 8);

  // Sheets own the bottom of the screen. Never stack chips/cards/CTA over them.
  if (chrome === "hidden") {
    return <div className="map-chrome" data-map-chrome="hidden" hidden />;
  }

  if (chrome === "confirm") {
    return (
      <div className="map-chrome pointer-events-none absolute inset-x-0 bottom-0 z-[400] flex flex-col px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-8">
        <div className="pointer-events-auto mx-auto flex w-full max-w-lg flex-col gap-3">
          <button
            type="button"
            onClick={onConfirmDrop}
            className="h-12 w-full rounded-full bg-white text-sm font-semibold text-[#00356b] shadow-[0_10px_40px_rgba(0,0,0,0.55)]"
          >
            Pin it here
          </button>
          <button
            type="button"
            onClick={onToggleDrop}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-base font-semibold text-black hover:bg-zinc-200"
          >
            <CrosshairIcon className="size-4" />
            Cancel drop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="map-chrome pointer-events-none absolute inset-x-0 bottom-0 z-[400] flex flex-col gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-8 bg-linear-to-t from-[#07080c] via-[#07080c]/85 to-transparent">
      <div className="map-browse-chrome pointer-events-auto ml-auto flex flex-col gap-1.5">
        <IconFab label="Zoom in" onClick={onZoomIn}>
          <PlusIcon className="size-4" />
        </IconFab>
        <IconFab label="Zoom out" onClick={onZoomOut}>
          <MinusIcon className="size-4" />
        </IconFab>
      </div>

      <div className="pointer-events-auto relative mx-auto w-full max-w-lg">
        <div className="map-browse-chrome mb-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterChip
            active={filter === "all"}
            onClick={() => onFilter("all")}
            color="#4c9be8"
            label={`All · ${liveCount}`}
          />
          {PIN_TYPES.map((type) => (
            <FilterChip
              key={type}
              active={filter === type}
              onClick={() => onFilter(type)}
              color={TYPE_META[type].color}
              label={TYPE_META[type].short}
            />
          ))}
        </div>

        {ranked.length > 0 ? (
          <div className="map-browse-chrome mb-2 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {ranked.map((pin) => {
              const meta = TYPE_META[pin.type];
              const heat = computeHeat(pin, now);
              return (
                <button
                  key={pin.id}
                  type="button"
                  onClick={() => onSelect(pin.id)}
                  className="min-w-[11.5rem] shrink-0 rounded-2xl border border-white/10 bg-[#10131b]/80 px-3 py-2.5 text-left backdrop-blur-md"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                      style={{ color: meta.color }}
                    >
                      {meta.short}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatTimeLeft(pin.expiresAt, now)}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                    {pin.title}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {pin.votes}↑ · {pin.going} going
                    {heat.hot ? (
                      <span className="text-signal"> · hot</span>
                    ) : null}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="map-browse-chrome mb-2 rounded-2xl border border-white/10 bg-[#10131b]/80 px-3 py-3 text-sm text-muted-foreground backdrop-blur-md">
            Nothing live in this filter. Drop a pin and make it true.
          </div>
        )}

        <button
          type="button"
          onClick={onToggleDrop}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-signal text-base font-semibold text-white hover:bg-signal/85"
        >
          <BulldogMark className="size-5 text-white" />
          Drop pin
        </button>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  color,
  label,
}: {
  active: boolean;
  onClick: () => void;
  color: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium tracking-wide"
      style={{
        borderColor: active ? color : "rgba(255,255,255,0.12)",
        background: active ? `${color}22` : "rgba(16,19,27,0.72)",
        color: active ? color : "#c5cddd",
      }}
    >
      {label}
    </button>
  );
}

function IconFab({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-full border border-white/12 bg-[#10131b]/80 text-foreground backdrop-blur-md"
    >
      {children}
    </button>
  );
}
