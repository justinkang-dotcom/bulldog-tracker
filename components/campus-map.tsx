"use client";

import { computeHeat } from "@/lib/heat";
import { TYPE_META } from "@/lib/pin-meta";
import type { PublicPin } from "@/lib/types";
import {
  DEFAULT_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  YALE_BOUNDS,
  YALE_CENTER,
} from "@/lib/yale";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

export type CampusMapHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  getCenter: () => { lat: number; lng: number } | null;
};

type Props = {
  pins: PublicPin[];
  selectedId: string | null;
  dropMode: boolean;
  onPinClick: (id: string) => void;
  onMapClick: (lat: number, lng: number) => void;
  focus: { lat: number; lng: number } | null;
};

function markerSignature(pin: PublicPin, selected: boolean) {
  return `${pin.votes}:${pin.going}:${pin.minutesLeft}:${selected}:${pin.type}`;
}

export const CampusMap = forwardRef<CampusMapHandle, Props>(function CampusMap(
  { pins, selectedId, dropMode, onPinClick, onMapClick, focus },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, LeafletMarker>>(new Map());
  const signaturesRef = useRef<Map<string, string>>(new Map());
  const onPinClickRef = useRef(onPinClick);
  const onMapClickRef = useRef(onMapClick);
  const dropModeRef = useRef(dropMode);
  const [mapReady, setMapReady] = useState(false);

  onPinClickRef.current = onPinClick;
  onMapClickRef.current = onMapClick;
  dropModeRef.current = dropMode;

  useImperativeHandle(ref, () => ({
    zoomIn: () => mapRef.current?.zoomIn(),
    zoomOut: () => mapRef.current?.zoomOut(),
    getCenter: () => {
      const center = mapRef.current?.getCenter();
      return center ? { lat: center.lat, lng: center.lng } : null;
    },
  }));

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    const markers = markersRef.current;
    const signatures = signaturesRef.current;

    void (async () => {
      const leaflet = await import("leaflet");
      const L = leaflet.default;
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: YALE_CENTER,
        zoom: DEFAULT_ZOOM,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        zoomControl: false,
        attributionControl: false,
        maxBounds: L.latLngBounds(YALE_BOUNDS[0], YALE_BOUNDS[1]),
        maxBoundsViscosity: 0.85,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: MAX_ZOOM,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      L.control
        .attribution({
          prefix: false,
          position: "bottomleft",
        })
        .addAttribution(
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://carto.com/attributions">CARTO</a>'
        )
        .addTo(map);

      map.on("click", (event) => {
        if (dropModeRef.current) return;
        onMapClickRef.current(event.latlng.lat, event.latlng.lng);
      });

      mapRef.current = map;
      setMapReady(true);
      requestAnimationFrame(() => map.invalidateSize());
      window.setTimeout(() => map.invalidateSize(), 250);

      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(containerRef.current);
    })();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      markers.forEach((marker) => marker.remove());
      markers.clear();
      signatures.clear();
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    void import("leaflet").then((leaflet) => {
      const L = leaflet.default;
      const live = mapRef.current;
      if (!live) return;

      const nextIds = new Set(pins.map((p) => p.id));
      for (const [id, marker] of markersRef.current) {
        if (!nextIds.has(id)) {
          marker.remove();
          markersRef.current.delete(id);
          signaturesRef.current.delete(id);
        }
      }

      for (const pin of pins) {
        const selected = pin.id === selectedId;
        const signature = markerSignature(pin, selected);
        const existing = markersRef.current.get(pin.id);
        if (existing && signaturesRef.current.get(pin.id) === signature) {
          continue;
        }
        const icon = buildIcon(L, pin, selected);
        const heat = computeHeat(pin);
        if (existing) {
          existing.setLatLng([pin.lat, pin.lng]);
          existing.setIcon(icon);
          existing.setZIndexOffset(
            Math.round(heat.score * 80) + (selected ? 400 : 0)
          );
        } else {
          const marker = L.marker([pin.lat, pin.lng], {
            icon,
            keyboard: true,
            riseOnHover: true,
            zIndexOffset: Math.round(heat.score * 80),
            title: pin.title,
          });
          marker.on("click", (event) => {
            L.DomEvent.stopPropagation(event);
            onPinClickRef.current(pin.id);
          });
          marker.addTo(live);
          markersRef.current.set(pin.id, marker);
        }
        signaturesRef.current.set(pin.id, signature);
      }
    });
  }, [pins, selectedId, mapReady]);

  useEffect(() => {
    if (!focus || !mapRef.current) return;
    mapRef.current.flyTo([focus.lat, focus.lng], Math.max(mapRef.current.getZoom(), 16), {
      duration: 0.55,
    });
  }, [focus]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 bg-[#07080c]"
      data-drop-mode={dropMode ? "true" : "false"}
    />
  );
});

CampusMap.displayName = "CampusMap";

function markerSize(votes: number, selected: boolean) {
  const base = Math.min(68, Math.max(32, 32 + votes * 0.85));
  return Math.round(selected ? base + 8 : base);
}

function buildIcon(
  L: typeof import("leaflet"),
  pin: PublicPin,
  selected: boolean
) {
  const heat = computeHeat(pin);
  const size = markerSize(pin.votes, selected);
  const meta = TYPE_META[pin.type];
  return L.divIcon({
    className: "hotspot-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, Math.round(size * 0.92)],
    html: `<div class="hotspot hotspot-bulldog${heat.hot ? " is-hot" : ""}${selected ? " is-selected" : ""}" style="--c:${meta.color};--g:${meta.glow};--s:${size}px;--o:${heat.opacity};--glow:${heat.glow}px;--bob-delay:${((pin.id.charCodeAt(0) || 0) % 10) * 0.14}s" role="img" aria-label="Handsome Dan"><img class="handsome-dan-img" src="/handsome-dan.png" alt="" width="${size}" height="${size}" draggable="false" /></div>`,
  });
}
