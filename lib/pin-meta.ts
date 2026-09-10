import type { PinType } from "./types";

export const YALE_BLUE = "#4c9be8";
export const YALE_BLUE_DEEP = "#00356b";

export const TYPE_META: Record<
  PinType,
  { label: string; short: string; color: string; glow: string; blurb: string }
> = {
  function: {
    label: "Function",
    short: "Function",
    color: "#7eb6ff",
    glow: "rgba(126, 182, 255, 0.5)",
    blurb: "A planned gathering — show, meeting, college event.",
  },
  "pop-up": {
    label: "Pop-up",
    short: "Pop-up",
    color: "#4c9be8",
    glow: "rgba(76, 155, 232, 0.55)",
    blurb: "It just appeared. Get there before it doesn't.",
  },
  sighting: {
    label: "Sighting",
    short: "Sighting",
    color: "#9fd0ff",
    glow: "rgba(159, 208, 255, 0.45)",
    blurb: "Something weird, famous, or worth a look.",
  },
  food: {
    label: "Food",
    short: "Food",
    color: "#6aa9e8",
    glow: "rgba(106, 169, 232, 0.5)",
    blurb: "Free food, a truck, a line worth joining.",
  },
  other: {
    label: "Other",
    short: "Other",
    color: "#c5d8f0",
    glow: "rgba(197, 216, 240, 0.4)",
    blurb: "Doesn't fit a box. Still happening.",
  },
};

/** Justin's flat brown/cream bulldog face (transparent PNG). */
export const BULLDOG_SRC = "/handsome-dan.png?v=8";
