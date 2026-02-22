export const SPECIALTIES = [
  { value: "general", label: "General Practice" },
  { value: "cardiology", label: "Cardiology" },
  { value: "dermatology", label: "Dermatology" },
  { value: "endocrinology", label: "Endocrinology" },
  { value: "gastroenterology", label: "Gastroenterology" },
  { value: "neurology", label: "Neurology" },
  { value: "obgyn", label: "Obstetrics & Gynecology" },
  { value: "oncology", label: "Oncology" },
  { value: "ophthalmology", label: "Ophthalmology" },
  { value: "orthopedics", label: "Orthopedics" },
  { value: "otolaryngology", label: "ENT (Otolaryngology)" },
  { value: "pediatrics", label: "Pediatrics" },
  { value: "psychiatry", label: "Psychiatry" },
  { value: "pulmonology", label: "Pulmonology" },
  { value: "urology", label: "Urology" },
] as const;

export type SpecialtyValue = (typeof SPECIALTIES)[number]["value"];

export function specialtyLabel(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const row = SPECIALTIES.find((s) => s.value === value);
  return row?.label ?? value;
}
