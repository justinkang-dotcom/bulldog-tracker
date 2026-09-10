import { LANDMARKS } from "./yale";
import type { Pin } from "./types";

type SeedSpec = Omit<
  Pin,
  | "createdAt"
  | "expiresAt"
  | "voterIds"
  | "goingIds"
  | "reporterIds"
  | "hidden"
  | "seed"
>;

export const SEED_SPECS: SeedSpec[] = [
  {
    id: "seed-cross-campus",
    title: "Blanket concert on the grass",
    type: "pop-up",
    note: "A cappella, a bluetooth speaker, and about forty people on Cross Campus. Bring a jacket.",
    lat: LANDMARKS.crossCampus.lat,
    lng: LANDMARKS.crossCampus.lng,
    durationMinutes: 90,
    votes: 24,
    going: 11,
  },
  {
    id: "seed-tsai-becton",
    title: "Demo night overflow at Tsai",
    type: "function",
    note: "Pitches spilled into the Becton lobby. Standing room, strong opinions, free seltzer.",
    lat: LANDMARKS.tsaiBecton.lat,
    lng: LANDMARKS.tsaiBecton.lng,
    durationMinutes: 120,
    votes: 17,
    going: 8,
  },
  {
    id: "seed-broadway",
    title: "Free slices on Broadway",
    type: "food",
    note: "Someone ordered too much. Boxes on the wall outside Yorkside. Come hungry.",
    lat: LANDMARKS.broadway.lat,
    lng: LANDMARKS.broadway.lng,
    durationMinutes: 60,
    votes: 41,
    going: 22,
  },
  {
    id: "seed-science-hill",
    title: "Coyote cut through Science Hill",
    type: "sighting",
    note: "Spotted near Pauli Murray, heading toward the labs. Keep your distance — just look.",
    lat: LANDMARKS.pauliMurray.lat,
    lng: LANDMARKS.pauliMurray.lng,
    durationMinutes: 90,
    votes: 13,
    going: 3,
  },
  {
    id: "seed-bass",
    title: "Espresso cart in Bass",
    type: "other",
    note: "Surprise cart in the nave. Line is moving. Laptops welcome, talking is not.",
    lat: LANDMARKS.bassLibrary.lat,
    lng: LANDMARKS.bassLibrary.lng,
    durationMinutes: 90,
    votes: 19,
    going: 9,
  },
];

export function materializeSeed(
  spec: (typeof SEED_SPECS)[number],
  now = Date.now()
): Pin {
  const durationMs = spec.durationMinutes * 60_000;
  return {
    ...spec,
    createdAt: now - Math.round(durationMs * 0.18),
    expiresAt: now + Math.round(durationMs * 0.82),
    voterIds: [],
    goingIds: [],
    reporterIds: [],
    hidden: false,
    seed: true,
  };
}

export function materializeSeeds(now = Date.now()): Pin[] {
  return SEED_SPECS.map((spec) => materializeSeed(spec, now));
}
