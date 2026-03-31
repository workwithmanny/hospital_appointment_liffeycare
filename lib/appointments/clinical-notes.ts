/**
 * Structured clinical documentation fields (aligned with doctor session UI).
 */
export const CLINICAL_NOTE_FIELDS = [
  ["chief_complaint", "Chief complaint"],
  ["hpi", "History of present illness"],
  ["exam", "Examination findings"],
  ["assessment", "Assessment / diagnosis"],
  ["plan", "Treatment plan"],
  ["prescriptions", "Prescriptions"],
  ["followup", "Follow-up"],
] as const;

export type ClinicalNoteFieldKey = (typeof CLINICAL_NOTE_FIELDS)[number][0];

const KNOWN_KEYS = new Set<string>(CLINICAL_NOTE_FIELDS.map(([k]) => k));

/** Coerce jsonb / API payloads into flat string map for display and forms. */
export function parseClinicalNotes(raw: unknown): Record<string, string> {
  if (raw == null || raw === "") return {};
  if (typeof raw === "string") {
    try {
      return parseClinicalNotes(JSON.parse(raw) as unknown);
    } catch {
      return {};
    }
  }
  if (typeof raw !== "object" || Array.isArray(raw)) return {};

  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v == null) out[k] = "";
    else if (typeof v === "string") out[k] = v;
    else if (typeof v === "number" || typeof v === "boolean")
      out[k] = String(v);
    else out[k] = JSON.stringify(v, null, 2);
  }
  return out;
}

export function clinicalFieldLabel(key: string): string {
  const row = CLINICAL_NOTE_FIELDS.find(([k]) => k === key);
  if (row) return row[1];
  return key.replace(/_/g, " ");
}

export function extraClinicalKeys(map: Record<string, string>): string[] {
  return Object.keys(map)
    .filter((k) => !KNOWN_KEYS.has(k))
    .sort((a, b) => a.localeCompare(b));
}
