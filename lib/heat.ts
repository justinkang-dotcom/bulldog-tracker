import { TYPE_META } from "./pin-meta";
import type { PinType, PublicPin } from "./types";

export type Heat = {
  score: number;
  size: number;
  opacity: number;
  glow: number;
  color: string;
  hot: boolean;
};

export function computeHeat(
  pin: Pick<PublicPin, "votes" | "going" | "createdAt" | "expiresAt" | "type">,
  now = Date.now()
): Heat {
  const lifespan = Math.max(1, pin.expiresAt - pin.createdAt);
  const remaining = Math.max(0, pin.expiresAt - now);
  const recency = remaining / lifespan;
  const voteWeight = Math.log2(2 + pin.votes);
  const goingWeight = Math.log2(2 + pin.going) * 0.65;
  const score = (voteWeight + goingWeight) * (0.35 + 0.65 * recency);

  const voteSize = 32 + Math.min(36, pin.votes * 0.85);
  const size = Math.min(68, Math.max(32, voteSize));
  const opacity = 0.55 + recency * 0.4;
  const glow = 10 + score * 4;
  const hot = score > 4.2 && recency > 0.25;

  return {
    score,
    size,
    opacity,
    glow,
    color: TYPE_META[pin.type as PinType].color,
    hot,
  };
}

export function sortByHeat<T extends PublicPin>(pins: T[], now = Date.now()): T[] {
  return [...pins].sort((a, b) => computeHeat(b, now).score - computeHeat(a, now).score);
}
