import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { minutesLeft } from "./format";
import { materializeSeed, materializeSeeds, SEED_SPECS } from "./seeds";
import type { CreatePinInput, Pin, PublicPin } from "./types";
import { PIN_TYPES, DURATIONS } from "./types";
import { isOnCampus } from "./yale";

const REPORT_HIDE_THRESHOLD = 3;
const SEED_IDS = new Set(SEED_SPECS.map((s) => s.id));

function dataFile(): string {
  if (process.env.VERCEL) {
    return path.join("/tmp", "web-pins.json");
  }
  return path.join(process.cwd(), "data", "pins.json");
}

let memory: Pin[] | null = null;
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job, job);
  queue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function isActive(pin: Pin, now = Date.now()): boolean {
  return !pin.hidden && pin.expiresAt > now;
}

function toPublic(pin: Pin, deviceId: string, now = Date.now()): PublicPin {
  return {
    id: pin.id,
    title: pin.title,
    type: pin.type,
    note: pin.note,
    lat: pin.lat,
    lng: pin.lng,
    createdAt: pin.createdAt,
    expiresAt: pin.expiresAt,
    durationMinutes: pin.durationMinutes,
    votes: pin.votes,
    going: pin.going,
    hidden: pin.hidden,
    seed: pin.seed,
    voted: pin.voterIds.includes(deviceId),
    goingByMe: pin.goingIds.includes(deviceId),
    reportedByMe: pin.reporterIds.includes(deviceId),
    minutesLeft: minutesLeft(pin.expiresAt, now),
  };
}

async function readFromDisk(): Promise<Pin[] | null> {
  try {
    const raw = await readFile(dataFile(), "utf8");
    const parsed = JSON.parse(raw) as Pin[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeToDisk(pins: Pin[]): Promise<void> {
  const file = dataFile();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(pins, null, 2), "utf8");
}

function refreshExpiredSeeds(pins: Pin[], now: number): Pin[] {
  const next = pins.filter((p) => !SEED_IDS.has(p.id));
  let changed = next.length !== pins.length;
  for (const spec of SEED_SPECS) {
    const existing = pins.find((p) => p.id === spec.id);
    if (existing && isActive(existing, now)) {
      next.push(existing);
    } else {
      next.push(materializeSeed(spec, now));
      changed = true;
    }
  }
  return changed ? next : pins;
}

async function loadLocked(): Promise<Pin[]> {
  const now = Date.now();
  if (!memory) {
    const fromDisk = await readFromDisk();
    memory = fromDisk ?? materializeSeeds(now);
    if (!fromDisk) {
      await writeToDisk(memory);
    }
  }
  const next = refreshExpiredSeeds(memory, now);
  if (next !== memory) {
    memory = next;
    await writeToDisk(memory);
  }
  return memory;
}

async function saveLocked(pins: Pin[]): Promise<void> {
  memory = pins;
  await writeToDisk(pins);
}

export async function listPublicPins(deviceId: string): Promise<PublicPin[]> {
  return enqueue(async () => {
    const now = Date.now();
    const pins = await loadLocked();
    return pins.filter((p) => isActive(p, now)).map((p) => toPublic(p, deviceId, now));
  });
}

export async function createPin(input: CreatePinInput): Promise<PublicPin> {
  return enqueue(async () => {
    const now = Date.now();
    const pins = await loadLocked();
    const pin: Pin = {
      id: crypto.randomUUID(),
      title: input.title,
      type: input.type,
      note: input.note ?? "",
      lat: input.lat,
      lng: input.lng,
      createdAt: now,
      expiresAt: now + input.durationMinutes * 60_000,
      durationMinutes: input.durationMinutes,
      votes: 1,
      going: 0,
      voterIds: [input.deviceId],
      goingIds: [],
      reporterIds: [],
      hidden: false,
      seed: false,
    };
    await saveLocked([...pins, pin]);
    return toPublic(pin, input.deviceId, now);
  });
}

export async function toggleVote(
  id: string,
  deviceId: string
): Promise<PublicPin | null> {
  return enqueue(async () => {
    const now = Date.now();
    const pins = await loadLocked();
    const pin = pins.find((p) => p.id === id);
    if (!pin || !isActive(pin, now)) return null;
    const has = pin.voterIds.includes(deviceId);
    if (has) {
      pin.voterIds = pin.voterIds.filter((d) => d !== deviceId);
      pin.votes = Math.max(0, pin.votes - 1);
    } else {
      pin.voterIds = [...pin.voterIds, deviceId];
      pin.votes += 1;
    }
    await saveLocked(pins);
    return toPublic(pin, deviceId, now);
  });
}

export async function toggleGoing(
  id: string,
  deviceId: string
): Promise<PublicPin | null> {
  return enqueue(async () => {
    const now = Date.now();
    const pins = await loadLocked();
    const pin = pins.find((p) => p.id === id);
    if (!pin || !isActive(pin, now)) return null;
    const has = pin.goingIds.includes(deviceId);
    if (has) {
      pin.goingIds = pin.goingIds.filter((d) => d !== deviceId);
      pin.going = Math.max(0, pin.going - 1);
    } else {
      pin.goingIds = [...pin.goingIds, deviceId];
      pin.going += 1;
    }
    await saveLocked(pins);
    return toPublic(pin, deviceId, now);
  });
}

export async function reportPin(
  id: string,
  deviceId: string
): Promise<{ pin: PublicPin | null; hidden: boolean; already: boolean } | null> {
  return enqueue(async () => {
    const now = Date.now();
    const pins = await loadLocked();
    const pin = pins.find((p) => p.id === id);
    if (!pin || !isActive(pin, now)) return null;
    if (pin.reporterIds.includes(deviceId)) {
      return { pin: toPublic(pin, deviceId, now), hidden: false, already: true };
    }
    pin.reporterIds = [...pin.reporterIds, deviceId];
    const hidden = pin.reporterIds.length >= REPORT_HIDE_THRESHOLD;
    if (hidden) pin.hidden = true;
    await saveLocked(pins);
    return {
      pin: hidden ? null : toPublic(pin, deviceId, now),
      hidden,
      already: false,
    };
  });
}

export function parseCreateBody(body: unknown): CreatePinInput | string {
  if (!body || typeof body !== "object") return "Expected a JSON body.";
  const b = body as Record<string, unknown>;
  const title = typeof b.title === "string" ? b.title.trim() : "";
  if (title.length < 2) return "Give it a short title.";
  if (title.length > 72) return "Title is too long (72 characters max).";
  if (typeof b.type !== "string" || !PIN_TYPES.includes(b.type as never)) {
    return "Pick a type.";
  }
  const note = typeof b.note === "string" ? b.note.trim() : "";
  if (note.length > 200) return "Note is too long (200 characters max).";
  const durationMinutes = b.durationMinutes;
  if (
    typeof durationMinutes !== "number" ||
    !DURATIONS.includes(durationMinutes as never)
  ) {
    return "Duration must be 30, 60, 90, or 120 minutes.";
  }
  const lat = b.lat;
  const lng = b.lng;
  if (typeof lat !== "number" || typeof lng !== "number" || Number.isNaN(lat) || Number.isNaN(lng)) {
    return "Drop the pin on the map first.";
  }
  if (!isOnCampus(lat, lng)) {
    return "Pins have to land on or near Yale campus.";
  }
  const deviceId = typeof b.deviceId === "string" ? b.deviceId.trim() : "";
  if (deviceId.length < 8 || deviceId.length > 80) {
    return "Missing device id.";
  }
  return {
    title,
    type: b.type as CreatePinInput["type"],
    note,
    lat,
    lng,
    durationMinutes: durationMinutes as CreatePinInput["durationMinutes"],
    deviceId,
  };
}

export function parseDeviceId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  if (id.length < 8 || id.length > 80) return null;
  return id;
}
