import "server-only";
import { randomInt } from "node:crypto";

const TRACKING_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateTrackingCode() {
  let code = "BF-";
  for (let i = 0; i < 6; i++) code += TRACKING_ALPHABET[randomInt(TRACKING_ALPHABET.length)];
  return code;
}

export function generateSealCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function generateStorageSlot() {
  return `${"ABCDEF"[randomInt(6)]}-${randomInt(1, 41)}`;
}
