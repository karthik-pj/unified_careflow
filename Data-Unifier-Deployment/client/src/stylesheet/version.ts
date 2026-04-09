const MAJOR = 1;
const MINOR = 0;
const PATCH = 0;

export const version = { major: MAJOR, minor: MINOR, patch: PATCH };
export const buildDate = "2026-03-03";
export const versionString = `${MAJOR}.${MINOR}.${PATCH}`;

export function formatVersion(prefix = "V"): string {
  return `${prefix} ${versionString}`;
}

export function fullVersionInfo(): string {
  return `CareFlow Systems ${formatVersion()} (${buildDate})`;
}
