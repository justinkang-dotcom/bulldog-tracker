"use client";

import { BottomDock } from "@/components/bottom-dock";
import { CampusMap, type CampusMapHandle } from "@/components/campus-map";
import { DropPinSheet } from "@/components/drop-pin-sheet";
import { PinDetailSheet } from "@/components/pin-detail-sheet";
import { TopBar } from "@/components/top-bar";
import { usePins } from "@/hooks/use-pins";
import { ensureDeviceId } from "@/lib/device-id";
import type { DurationMinutes, PinType, PublicPin } from "@/lib/types";
import { CrosshairIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type Draft = { lat: number; lng: number };

export function TrackerApp({ initialPins = [] }: { initialPins?: PublicPin[] }) {
  const { pins, status, error, refresh, upsert } = usePins(initialPins);
  const [now, setNow] = useState(() => Date.now());
  const [filter, setFilter] = useState<PinType | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dropMode, setDropMode] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [focus, setFocus] = useState<Draft | null>(null);
  const mapRef = useRef<CampusMapHandle>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (error && status === "error") {
      toast.error(error);
    }
  }, [error, status]);

  const visiblePins = useMemo(() => {
    const live = pins.filter((pin) => pin.expiresAt > now && !pin.hidden);
    if (filter === "all") return live;
    return live.filter((pin) => pin.type === filter);
  }, [pins, filter, now]);

  const selected = visiblePins.find((pin) => pin.id === selectedId) ?? null;

  function openDraft(lat: number, lng: number) {
    setDropMode(false);
    setSelectedId(null);
    setDraft({ lat, lng });
    setFormOpen(true);
  }

  function handleMapClick(lat: number, lng: number) {
    if (selectedId) {
      setSelectedId(null);
      return;
    }
    if (formOpen) return;
    openDraft(lat, lng);
  }

  function handleToggleDrop() {
    if (formOpen) return;
    if (dropMode) {
      setDropMode(false);
      return;
    }
    setSelectedId(null);
    setDropMode(true);
  }

  function confirmDropHere() {
    const center = mapRef.current?.getCenter();
    if (center) openDraft(center.lat, center.lng);
  }

  async function postJson<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as T & { error?: string };
    if (!res.ok) {
      throw new Error(data?.error ?? "Request failed.");
    }
    return data;
  }

  async function handleCreate(input: {
    title: string;
    type: PinType;
    note: string;
    durationMinutes: DurationMinutes;
    lat: number;
    lng: number;
  }) {
    const deviceId = ensureDeviceId() || crypto.randomUUID();
    const data = await postJson<{ pin: PublicPin }>("/api/pins", {
      ...input,
      deviceId,
    });
    upsert(data.pin);
    setFilter("all");
    setFormOpen(false);
    setDraft(null);
    setDropMode(false);
    setSelectedId(data.pin.id);
    setFocus({ lat: data.pin.lat, lng: data.pin.lng });
    toast.success("Pin is live. Watch it glow.");
  }

  async function handleUpvote(id: string) {
    const data = await postJson<{ pin: PublicPin }>(`/api/pins/${id}/upvote`, {
      deviceId: ensureDeviceId(),
    });
    upsert(data.pin);
  }

  async function handleGoing(id: string) {
    const data = await postJson<{ pin: PublicPin }>(`/api/pins/${id}/going`, {
      deviceId: ensureDeviceId(),
    });
    upsert(data.pin);
  }

  async function handleReport(id: string) {
    const data = await postJson<{
      pin: PublicPin | null;
      hidden: boolean;
      already: boolean;
    }>(`/api/pins/${id}/report`, { deviceId: ensureDeviceId() });
    if (data.already) {
      toast.message("You already reported this pin.");
      return;
    }
    if (data.hidden) {
      upsert(null, id);
      setSelectedId(null);
      toast.success("Pin taken down after enough reports.");
      return;
    }
    if (data.pin) upsert(data.pin);
    toast.success("Reported. Thanks for keeping the map clean.");
  }

  const chrome = formOpen || selected ? "hidden" : dropMode ? "confirm" : "browse";
  const layer = formOpen ? "sheet" : selected ? "detail" : dropMode ? "confirm" : "map";

  return (
    <div
      className="relative h-dvh w-full overflow-hidden bg-[#07080c] text-foreground"
      data-ui={layer}
    >
      <CampusMap
        ref={mapRef}
        pins={visiblePins}
        selectedId={selectedId}
        dropMode={dropMode}
        onPinClick={(id) => {
          setDropMode(false);
          setSelectedId(id);
        }}
        onMapClick={handleMapClick}
        focus={focus}
      />

      <div className="pointer-events-none absolute inset-0 z-[500] web-vignette" />

      {layer === "map" || layer === "confirm" ? (
        <TopBar liveCount={visiblePins.length} status={status} />
      ) : null}

      {dropMode ? (
        <div className="pointer-events-none absolute inset-0 z-[500]">
          <div className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2">
            <div className="relative grid size-20 place-items-center">
              <span className="absolute inset-0 rounded-full border border-signal/50" />
              <span className="absolute inset-3 rounded-full border border-white/30" />
              <CrosshairIcon className="size-6 text-signal" />
            </div>
          </div>
        </div>
      ) : null}

      <BottomDock
        pins={visiblePins}
        now={now}
        filter={filter}
        onFilter={setFilter}
        chrome={chrome}
        onConfirmDrop={confirmDropHere}
        onToggleDrop={handleToggleDrop}
        onSelect={(id) => {
          const pin = visiblePins.find((p) => p.id === id);
          setSelectedId(id);
          if (pin) setFocus({ lat: pin.lat, lng: pin.lng });
        }}
        onZoomIn={() => mapRef.current?.zoomIn()}
        onZoomOut={() => mapRef.current?.zoomOut()}
        liveCount={visiblePins.length}
      />

      {status === "loading" && pins.length === 0 ? (
        <div className="absolute inset-0 z-[800] grid place-items-center bg-[#07080c]/55 text-sm text-zinc-300">
          Locking onto campus…
        </div>
      ) : null}

      {status === "error" && pins.length === 0 ? (
        <div className="absolute inset-x-0 top-1/3 z-[800] flex justify-center px-6">
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-2xl border border-white/10 bg-[#10131b] px-4 py-3 text-sm text-zinc-200"
          >
            Couldn&apos;t reach the web. Tap to retry.
          </button>
        </div>
      ) : null}

      <DropPinSheet
        open={formOpen}
        draft={draft}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setDraft(null);
        }}
        onSubmit={handleCreate}
      />
      <PinDetailSheet
        pin={selected}
        now={now}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        onUpvote={handleUpvote}
        onGoing={handleGoing}
        onReport={handleReport}
      />
    </div>
  );
}
