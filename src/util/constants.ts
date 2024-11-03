export const DEFAULT_VERSION = "1.21.3";
export const AVAILABLE_VERSIONS = ["1.21.1", "1.21.3"] as const;

export const ZOOM = {
  MIN: 0.25,
  MAX: 2,
  STEP: 0.1,
  WHEEL_FACTOR: -0.001,
} as const;

export const MOVEMENT = {
  STEP: 50,
} as const;

export const UI = {
  SELECT_WIDTH: 80,
} as const;
