"use client";

import { ensureDeviceId } from "@/lib/device-id";
import type { PublicPin } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

const POLL_MS = 4000;

type PinsResponse = { pins: PublicPin[]; serverTime: number };

export function usePins(initialPins: PublicPin[] = []) {
  const [pins, setPins] = useState<PublicPin[]>(initialPins);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    initialPins.length > 0 ? "ready" : "loading"
  );
  const [error, setError] = useState<string | null>(null);

  const fetchPins = useCallback(async () => {
    const deviceId = ensureDeviceId();
    if (!deviceId) return;
    try {
      const res = await fetch(`/api/pins?deviceId=${encodeURIComponent(deviceId)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Could not load pins.");
      }
      const data = (await res.json()) as PinsResponse;
      setPins(data.pins);
      setError(null);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load pins.");
      setStatus((s) => (s === "ready" ? "ready" : "error"));
    }
  }, []);

  useEffect(() => {
    const start = window.setTimeout(() => {
      void fetchPins();
    }, 0);
    const timer = window.setInterval(() => {
      void fetchPins();
    }, POLL_MS);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(timer);
    };
  }, [fetchPins]);

  const upsert = useCallback((pin: PublicPin | null, removeId?: string) => {
    setPins((current) => {
      if (removeId) return current.filter((p) => p.id !== removeId);
      if (!pin) return current;
      const index = current.findIndex((p) => p.id === pin.id);
      if (index === -1) return [...current, pin];
      const next = [...current];
      next[index] = pin;
      return next;
    });
  }, []);

  return { pins, status, error, refresh: fetchPins, upsert };
}
