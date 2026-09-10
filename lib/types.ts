export const PIN_TYPES = [
  "function",
  "pop-up",
  "sighting",
  "food",
  "other",
] as const;

export type PinType = (typeof PIN_TYPES)[number];

export const DURATIONS = [30, 60, 90, 120] as const;
export type DurationMinutes = (typeof DURATIONS)[number];

export type Pin = {
  id: string;
  title: string;
  type: PinType;
  note: string;
  lat: number;
  lng: number;
  createdAt: number;
  expiresAt: number;
  durationMinutes: DurationMinutes;
  votes: number;
  going: number;
  voterIds: string[];
  goingIds: string[];
  reporterIds: string[];
  hidden: boolean;
  seed: boolean;
};

export type PublicPin = {
  id: string;
  title: string;
  type: PinType;
  note: string;
  lat: number;
  lng: number;
  createdAt: number;
  expiresAt: number;
  durationMinutes: DurationMinutes;
  votes: number;
  going: number;
  hidden: boolean;
  seed: boolean;
  voted: boolean;
  goingByMe: boolean;
  reportedByMe: boolean;
  minutesLeft: number;
};

export type CreatePinInput = {
  title: string;
  type: PinType;
  note?: string;
  lat: number;
  lng: number;
  durationMinutes: DurationMinutes;
  deviceId: string;
};
