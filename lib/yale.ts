export const YALE_CENTER: [number, number] = [41.31215, -72.92655];

/** Soft leash so the map stays on campus, not the whole Northeast. */
export const YALE_BOUNDS: [[number, number], [number, number]] = [
  [41.3042, -72.9388],
  [41.3218, -72.9148],
];

/** Pins must land in this slightly larger box (central New Haven / Yale). */
export const PIN_BOUNDS = {
  minLat: 41.298,
  maxLat: 41.328,
  minLng: -72.948,
  maxLng: -72.905,
};

export const DEFAULT_ZOOM = 16;
export const MIN_ZOOM = 14;
export const MAX_ZOOM = 18;

export function isOnCampus(lat: number, lng: number): boolean {
  return (
    lat >= PIN_BOUNDS.minLat &&
    lat <= PIN_BOUNDS.maxLat &&
    lng >= PIN_BOUNDS.minLng &&
    lng <= PIN_BOUNDS.maxLng
  );
}

export const LANDMARKS = {
  crossCampus: { lat: 41.31072, lng: -72.92738, label: "Cross Campus" },
  tsaiBecton: { lat: 41.31292, lng: -72.92388, label: "Tsai CITY / Becton" },
  broadway: { lat: 41.31152, lng: -72.93042, label: "Broadway" },
  pauliMurray: { lat: 41.31748, lng: -72.92412, label: "Pauli Murray / Science Hill" },
  bassLibrary: { lat: 41.30998, lng: -72.92762, label: "Bass Library" },
} as const;
