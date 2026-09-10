"use client";

import { formatTimeLeft, isFading } from "@/lib/format";
import { TYPE_META } from "@/lib/pin-meta";
import type { PublicPin } from "@/lib/types";
import { FlagIcon, Loader2Icon, NavigationIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  pin: PublicPin | null;
  now: number;
  onOpenChange: (open: boolean) => void;
  onUpvote: (id: string) => Promise<void>;
  onGoing: (id: string) => Promise<void>;
  onReport: (id: string) => Promise<void>;
};

export function PinDetailSheet({
  pin,
  now,
  onOpenChange,
  onUpvote,
  onGoing,
  onReport,
}: Props) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!pin) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pin, onOpenChange]);

  if (!pin || !mounted) return null;

  return createPortal(
    <div
      data-pin-detail-sheet="true"
      className="fixed inset-0 z-[10050] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        aria-label="Close pin details"
        className="absolute inset-0 bg-black/78"
        onClick={() => onOpenChange(false)}
      />

      <div
        className="relative z-[10051] flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#10131b] shadow-[0_-12px_60px_rgba(0,0,0,0.55)] sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <PinDetailBody
          key={pin.id}
          pin={pin}
          now={now}
          titleId={titleId}
          onClose={() => onOpenChange(false)}
          onUpvote={onUpvote}
          onGoing={onGoing}
          onReport={onReport}
        />
      </div>
    </div>,
    document.body
  );
}

function PinDetailBody({
  pin,
  now,
  titleId,
  onClose,
  onUpvote,
  onGoing,
  onReport,
}: {
  pin: PublicPin;
  now: number;
  titleId: string;
  onClose: () => void;
  onUpvote: (id: string) => Promise<void>;
  onGoing: (id: string) => Promise<void>;
  onReport: (id: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState<"vote" | "going" | "report" | null>(null);
  const [confirmReport, setConfirmReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const meta = TYPE_META[pin.type];
  const fading = isFading(pin.expiresAt, now);

  async function run(kind: "vote" | "going" | "report", fn: () => Promise<void>) {
    setBusy(kind);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update pin.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="flex items-start justify-between gap-3 px-4 pb-1 pt-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ background: `${meta.color}22`, color: meta.color }}
            >
              {meta.label}
            </span>
            <span className={`text-xs ${fading ? "text-sky-300" : "text-muted-foreground"}`}>
              {fading ? "Fading · " : ""}
              {formatTimeLeft(pin.expiresAt, now)}
            </span>
          </div>
          <h2
            id={titleId}
            className="font-[family-name:var(--font-display)] text-2xl leading-tight tracking-tight"
          >
            {pin.title}
          </h2>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="grid size-9 shrink-0 place-items-center rounded-full border border-white/10 text-muted-foreground hover:text-foreground"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      <div className="overflow-y-auto px-4 pb-2 pt-2">
        <p className="text-left text-[15px] leading-relaxed text-zinc-300">
          {pin.note || "No extra note — just the pin."}
        </p>
        <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">{pin.votes}</strong> upvotes
          </span>
          <span className="text-white/20">·</span>
          <span>
            <strong className="text-foreground">{pin.going}</strong> going
          </span>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 p-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold ${
              pin.voted
                ? "bg-signal text-white hover:bg-signal/85"
                : "bg-white/8 text-foreground hover:bg-white/14"
            } disabled:opacity-50`}
            onClick={() => void run("vote", () => onUpvote(pin.id))}
            disabled={busy !== null}
          >
            {busy === "vote" ? <Loader2Icon className="size-4 animate-spin" /> : null}
            {pin.voted ? "Upvoted" : "Upvote"}
          </button>
          <button
            type="button"
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold ${
              pin.goingByMe
                ? "bg-emerald-400/20 text-emerald-200 hover:bg-emerald-400/28"
                : "bg-white/8 text-foreground hover:bg-white/14"
            } disabled:opacity-50`}
            onClick={() => void run("going", () => onGoing(pin.id))}
            disabled={busy !== null}
          >
            {busy === "going" ? <Loader2Icon className="size-4 animate-spin" /> : null}
            {pin.goingByMe ? "You're going" : "I'm going"}
          </button>
        </div>

        {confirmReport ? (
          <button
            type="button"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-destructive/15 text-sm font-semibold text-destructive hover:bg-destructive/25 disabled:opacity-50"
            onClick={() =>
              void run("report", async () => {
                await onReport(pin.id);
                setConfirmReport(false);
              })
            }
            disabled={busy !== null || pin.reportedByMe}
          >
            {busy === "report" ? <Loader2Icon className="size-4 animate-spin" /> : <TriangleAlertIcon className="size-4" />}
            {pin.reportedByMe ? "Already reported" : "Confirm report"}
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setConfirmReport(true)}
            disabled={pin.reportedByMe}
          >
            <FlagIcon className="size-3.5" />
            {pin.reportedByMe ? "Reported" : "Report this pin"}
          </button>
        )}
      </div>
    </>
  );
}
