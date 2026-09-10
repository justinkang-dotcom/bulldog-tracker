"use client";

import { TYPE_META } from "@/lib/pin-meta";
import { DURATIONS, PIN_TYPES, type DurationMinutes, type PinType } from "@/lib/types";
import { Loader2Icon, XIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

type Draft = {
  lat: number;
  lng: number;
};

type Props = {
  open: boolean;
  draft: Draft | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: {
    title: string;
    type: PinType;
    note: string;
    durationMinutes: DurationMinutes;
    lat: number;
    lng: number;
  }) => Promise<void>;
};

export function DropPinSheet({ open, draft, onOpenChange, onSubmit }: Props) {
  const titleId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<PinType>("pop-up");
  const [note, setNote] = useState("");
  const [duration, setDuration] = useState<DurationMinutes>(60);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setType("pop-up");
      setNote("");
      setDuration(60);
      setBusy(false);
      setError(null);
      return;
    }
    const timer = window.setTimeout(() => titleRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        event.preventDefault();
        onOpenChange(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onOpenChange]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;
    if (!draft) {
      setError("Drop the pin on the map first.");
      return;
    }
    const trimmed = title.trim();
    if (trimmed.length < 2) {
      setError("Give it a short title.");
      titleRef.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        title: trimmed,
        type,
        note: note.trim(),
        durationMinutes: duration,
        lat: draft.lat,
        lng: draft.lng,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not drop pin.");
      setBusy(false);
    }
  }

  if (!open || !mounted) return null;

  return createPortal(
    <div
      data-drop-sheet="true"
      className="fixed inset-0 z-[10050] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
    >
      {/* Overlay captures taps so map/chrome cannot steal them. It does not close the sheet. */}
      <div className="absolute inset-0 bg-black/78" aria-hidden="true" />

      <form
        onSubmit={handleSubmit}
        className="relative z-[10051] flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#10131b] shadow-[0_-12px_60px_rgba(0,0,0,0.55)] sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-4 pb-1 pt-4">
          <div>
            <h2
              id={titleId}
              className="font-[family-name:var(--font-display)] text-xl tracking-tight"
            >
              Drop a pin
            </h2>
            <p className="text-sm text-muted-foreground">
              Tell campus what&apos;s happening. It fades when the time&apos;s up.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={busy}
            onClick={() => onOpenChange(false)}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-white/10 text-muted-foreground hover:text-foreground"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Title
            </span>
            <input
              ref={titleRef}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Free pizza. Coyote. Midnight set."
              maxLength={72}
              autoComplete="off"
              className="h-11 rounded-lg border border-input bg-white/5 px-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Type
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              {PIN_TYPES.map((value) => {
                const active = type === value;
                const meta = TYPE_META[value];
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    className="flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[10px] font-medium tracking-wide transition"
                    style={{
                      borderColor: active ? meta.color : "rgba(255,255,255,0.08)",
                      background: active ? `${meta.color}22` : "rgba(255,255,255,0.03)",
                      color: active ? meta.color : "#9aa3b5",
                    }}
                  >
                    {meta.short}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">{TYPE_META[type].blurb}</p>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Note <span className="normal-case tracking-normal opacity-70">(optional)</span>
            </span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Where exactly, what to bring, how long the line is…"
              maxLength={200}
              rows={3}
              className="min-h-20 rounded-lg border border-input bg-white/5 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Lasts
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {DURATIONS.map((value) => {
                const active = duration === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDuration(value)}
                    className={`rounded-xl border py-2.5 text-sm font-medium transition ${
                      active
                        ? "border-signal/60 bg-signal/15 text-foreground"
                        : "border-white/8 bg-white/3 text-muted-foreground"
                    }`}
                  >
                    {value}m
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/6 p-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy || !draft}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-signal text-base font-semibold text-white hover:bg-signal/85 disabled:pointer-events-none disabled:opacity-50"
          >
            {busy ? <Loader2Icon className="size-4 animate-spin" /> : null}
            {busy ? "Dropping…" : "Pin it"}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
