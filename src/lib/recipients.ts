/**
 * Demo email recipients from EMAIL_ALLOWLIST.
 * Mapping (documented in MANUAL.md):
 *   1st address → Alex
 *   2nd address → Sam (falls back to 1st if only one entry)
 */
export function getAllowlistAddresses(): string[] {
  return (process.env.EMAIL_ALLOWLIST ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getAlexEmail(): string {
  const list = getAllowlistAddresses();
  return list[0] ?? "";
}

export function getSamEmail(): string {
  const list = getAllowlistAddresses();
  return list[1] ?? list[0] ?? "";
}

export function getDemoRecipients() {
  return {
    alex: getAlexEmail(),
    sam: getSamEmail(),
    allowlist: getAllowlistAddresses(),
  };
}
