// Fixed predefined tags for the browse by tag section - these never change
export const STANDARD_TAGS = [
  "photoshoot",
  "product shot",
  "lighting",
  "couple",
  "solo",
  "superhero",
  "movie poster",
  "aesthetic",
  "portrait",
  "landscape",
  "fashion",
  "cinematic",
  "vintage",
  "minimal",
  "fantasy",
] as const;

export type StandardTag = typeof STANDARD_TAGS[number];
