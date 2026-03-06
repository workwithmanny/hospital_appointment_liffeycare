"use client";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { SPECIALTIES } from "@/lib/constants/specialties";
import { useToast } from "@/components/ui/toast";
type Role = "patient" | "doctor" | "admin";
export type ProfileData = {
  id: string;
  role: Role;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  specialty: string | null;
  consultation_price: number | null;
  age: number | null;
  allergies: string[] | null;
  hospital?: string | null;
  certification?: string | null;
  gender?: "male" | "female" | "other" | "prefer_not_say" | null;
};
export function ProfileForm({
  initialProfile,
  mode,
}: {
  initialProfile: ProfileData;
  mode: "patient" | "doctor";
}) {
  const supabase = getSupabaseClient();
  const toast = useToast();
  const [fullName, setFullName] = useState(initialProfile.full_name ?? "");
  const [phone, setPhone] = useState(initialProfile.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url ?? "");
  const [specialty, setSpecialty] = useState(initialProfile.specialty ?? "");
  const [consultationPrice, setConsultationPrice] = useState(
    initialProfile.consultation_price ?? null,
  );
  const [age, setAge] = useState<number | "">(initialProfile.age ?? "");
  const [allergies, setAllergies] = useState<string[]>(
    initialProfile.allergies ?? [],
  );
  const [allergyInput, setAllergyInput] = useState("");
  const [hospital, setHospital] = useState(initialProfile.hospital ?? "");
  const [certification, setCertification] = useState(
    initialProfile.certification ?? "",
  );
  const [gender, setGender] = useState<
    "male" | "female" | "other" | "prefer_not_say" | ""
  >(initialProfile.gender ?? "");
  type AvailabilityRow = {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  };
  const defaultAvailability = useMemo<AvailabilityRow[]>(
    () => [
      { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: 5, startTime: "09:00", endTime: "17:00" },
    ],
    [],
  );
  const [availability, setAvailability] =
    useState<AvailabilityRow[]>(defaultAvailability);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [availabilitySaved, setAvailabilitySaved] = useState(false);
  const timeOptions = useMemo(() => {
    const out: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (const m of [0, 30]) {
        out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }
    return out;
  }, []);
  useEffect(() => {
    async function loadAvailability() {
      if (mode !== "doctor") return;
      setLoadingAvailability(true);
      try {
        const res = await fetch("/api/doctor/availability");
        const json = (await res.json()) as {
          rows?: AvailabilityRow[];
          error?: string;
        };
        if (!res.ok)
          throw new Error(json.error || "Failed to load availability");
        if (json.rows && json.rows.length) setAvailability(json.rows);
      } catch (e) {
        /* If it fails (e.g. policies not applied yet), keep defaults. */
      } finally {
        setLoadingAvailability(false);
      }
    }
    void loadAvailability();
  }, [mode]);
  async function onSaveAvailability() {
    setError(null);
    setAvailabilitySaved(false);
    setSavingAvailability(true);
    try {
      const res = await fetch("/api/doctor/availability", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rows: availability }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Failed to save availability");
      setAvailabilitySaved(true);
      toast.push({
        kind: "success",
        title: "Saved",
        message: "Availability saved.",
        ttlMs: 3000,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save availability");
      toast.push({
        kind: "error",
        title: "Couldn’t save",
        message: e instanceof Error ? e.message : "Failed to save availability",
        ttlMs: 4500,
      });
    } finally {
      setSavingAvailability(false);
    }
  }
  const canSave = useMemo(() => {
    if (!fullName.trim()) return false;
    if (mode === "patient") {
      if (
        age !== "" &&
        (Number.isNaN(Number(age)) || Number(age) < 0 || Number(age) > 130)
      )
        return false;
    }
    if (mode === "doctor") {
      if (
        consultationPrice !== null &&
        (Number.isNaN(consultationPrice) || consultationPrice < 0)
      )
        return false;
      if (
        age !== "" &&
        (Number.isNaN(Number(age)) || Number(age) < 0 || Number(age) > 130)
      )
        return false;
    }
    return true;
  }, [age, consultationPrice, fullName, mode]);
  async function onAvatarSelected(file: File | null) {
    if (!file) return;
    setError(null);
    setSaved(false);
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError("Image is too large. Max size is 5MB.");
      return;
    }
    setUploadingAvatar(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("You are not logged in.");
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${uid}/avatar.${ext}`;
      const upload = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
        cacheControl: "3600",
        contentType: file.type,
      });
      if (upload.error) throw new Error(upload.error.message);
      const { data: publicUrl } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      const url =
        publicUrl.publicUrl; /* Save immediately to profile so sidebar updates on refresh. */
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ avatar_url: url }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Failed to save avatar");
      setAvatarUrl(url);
      setSaved(true);
      toast.push({
        kind: "success",
        title: "Updated",
        message: "Profile photo updated.",
        ttlMs: 2500,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
      toast.push({
        kind: "error",
        title: "Upload failed",
        message: err instanceof Error ? err.message : "Failed to upload avatar",
        ttlMs: 4500,
      });
    } finally {
      setUploadingAvatar(false);
    }
  }
  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        full_name: fullName.trim(),
        phone: phone.trim() ? phone.trim() : null,
        avatar_url: avatarUrl.trim() ? avatarUrl.trim() : null,
      };
      if (mode === "patient") {
        body.age = age === "" ? null : Number(age);
        body.allergies = allergies.length ? allergies : null;
      }
      if (mode === "doctor") {
        body.specialty = specialty.trim() ? specialty.trim() : null;
        body.consultation_price =
          consultationPrice === null ? null : Number(consultationPrice);
        body.hospital = hospital.trim() ? hospital.trim() : null;
        body.certification = certification.trim() ? certification.trim() : null;
        body.gender = gender === "" ? null : gender;
        body.age = age === "" ? null : Number(age);
      }
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Failed to save");
      setSaved(true);
      toast.push({
        kind: "success",
        title: "Saved",
        message: "Profile updated.",
        ttlMs: 2500,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      toast.push({
        kind: "error",
        title: "Couldn’t save",
        message: err instanceof Error ? err.message : "Failed to save",
        ttlMs: 4500,
      });
    } finally {
      setSaving(false);
    }
  }
  return (
    <form onSubmit={onSave} className="max-w-2xl">
      {" "}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        {" "}
        <div>
          {" "}
          <h1 className="text-xl font-semibold text-gray-900">Profile</h1>{" "}
          <p className="text-sm text-gray-600">
            Update your information. Changes are saved to Supabase.
          </p>{" "}
        </div>{" "}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {" "}
            {error}{" "}
          </div>
        )}{" "}
        {/* Success notifications are shown via toasts */}{" "}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {" "}
          <label className="space-y-1">
            {" "}
            <span className="text-sm font-medium text-gray-700">
              Full name
            </span>{" "}
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
              required
            />{" "}
          </label>{" "}
          <label className="space-y-1">
            {" "}
            <span className="text-sm font-medium text-gray-700">
              Phone
            </span>{" "}
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+234..."
            />{" "}
          </label>{" "}
        </div>{" "}
        <div className="space-y-3">
          {" "}
          <div className="flex items-center justify-between gap-4">
            {" "}
            <div>
              {" "}
              <div className="text-sm font-medium text-gray-700">
                Profile photo
              </div>{" "}
              <div className="text-xs text-gray-500">
                Upload an image (PNG/JPG/WebP, max 5MB).
              </div>{" "}
            </div>{" "}
            <div className="w-20 h-20 rounded-2xl bg-gray-200 overflow-hidden flex items-center justify-center border border-gray-200">
              {" "}
              {avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */ <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-semibold text-gray-600">N/A</span>
              )}{" "}
            </div>{" "}
          </div>{" "}
          <input
            type="file"
            accept="image/*"
            disabled={uploadingAvatar}
            onChange={(e) => void onAvatarSelected(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200 disabled:opacity-50"
          />{" "}
          {uploadingAvatar && (
            <div className="text-xs text-gray-500">Uploading...</div>
          )}{" "}
        </div>{" "}
        {mode === "patient" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {" "}
            <label className="space-y-1">
              {" "}
              <span className="text-sm font-medium text-gray-700">
                Age
              </span>{" "}
              <input
                value={age}
                onChange={(e) =>
                  setAge(e.target.value === "" ? "" : Number(e.target.value))
                }
                type="number"
                min={0}
                max={130}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 34"
              />{" "}
            </label>{" "}
            <label className="space-y-1 sm:col-span-2">
              {" "}
              <span className="text-sm font-medium text-gray-700">
                Allergies
              </span>{" "}
              <div className="rounded-lg border border-gray-200 p-3 focus-within:ring-2 focus-within:ring-blue-500">
                {" "}
                <div className="flex flex-wrap gap-2">
                  {" "}
                  {allergies.length ? (
                    allergies.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() =>
                          setAllergies((prev) => prev.filter((x) => x !== a))
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-800 hover:bg-gray-100"
                        title="Click to remove"
                      >
                        {" "}
                        {a}{" "}
                        <span className="text-xs text-gray-500">×</span>{" "}
                      </button>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">
                      No allergies added yet.
                    </div>
                  )}{" "}
                </div>{" "}
                <div className="mt-2 flex items-center gap-2">
                  {" "}
                  <input
                    value={allergyInput}
                    onChange={(e) => setAllergyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        const v = allergyInput.trim().replace(/,$/, "");
                        if (!v) return;
                        setAllergies((prev) =>
                          Array.from(new Set([...prev, v])).slice(0, 50),
                        );
                        setAllergyInput("");
                      }
                      if (
                        e.key === "Backspace" &&
                        !allergyInput &&
                        allergies.length
                      ) {
                        setAllergies((prev) => prev.slice(0, -1));
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                    placeholder="Type an allergy and press Enter"
                  />{" "}
                  <button
                    type="button"
                    onClick={() => {
                      const v = allergyInput.trim();
                      if (!v) return;
                      setAllergies((prev) =>
                        Array.from(new Set([...prev, v])).slice(0, 50),
                      );
                      setAllergyInput("");
                    }}
                    className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-black disabled:opacity-50"
                    disabled={!allergyInput.trim()}
                  >
                    {" "}
                    Add{" "}
                  </button>{" "}
                </div>{" "}
                <div className="mt-2 text-xs text-gray-500">
                  {" "}
                  Tip: press Enter to add. Click a chip to remove.{" "}
                </div>{" "}
              </div>{" "}
            </label>{" "}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {" "}
            <label className="space-y-1">
              {" "}
              <span className="text-sm font-medium text-gray-700">
                Specialty
              </span>{" "}
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {" "}
                <option value="">Select specialty</option>{" "}
                {SPECIALTIES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {" "}
                    {s.label}{" "}
                  </option>
                ))}{" "}
              </select>{" "}
            </label>{" "}
            <label className="space-y-1">
              {" "}
              <span className="text-sm font-medium text-gray-700">
                Consultation price
              </span>{" "}
              <input
                value={consultationPrice ?? ""}
                onChange={(e) =>
                  setConsultationPrice(
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
                type="number"
                min={0}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 5000"
              />{" "}
            </label>{" "}
            <label className="space-y-1">
              {" "}
              <span className="text-sm font-medium text-gray-700">
                Hospital / Clinic
              </span>{" "}
              <input
                value={hospital}
                onChange={(e) => setHospital(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. LiffeyCare General Hospital"
              />{" "}
            </label>{" "}
            <label className="space-y-1">
              {" "}
              <span className="text-sm font-medium text-gray-700">
                Certification
              </span>{" "}
              <input
                value={certification}
                onChange={(e) => setCertification(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. MBBS, FMCPsych"
              />{" "}
            </label>{" "}
            <label className="space-y-1">
              {" "}
              <span className="text-sm font-medium text-gray-700">
                Gender
              </span>{" "}
              <select
                value={gender}
                onChange={(e) =>
                  setGender(
                    e.target.value as
                      | "male"
                      | "female"
                      | "other"
                      | "prefer_not_say"
                      | "",
                  )
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {" "}
                <option value="">Prefer not to say</option>{" "}
                <option value="male">Male</option>{" "}
                <option value="female">Female</option>{" "}
                <option value="other">Other</option>{" "}
                <option value="prefer_not_say">Prefer not to say</option>{" "}
              </select>{" "}
            </label>{" "}
            <label className="space-y-1">
              {" "}
              <span className="text-sm font-medium text-gray-700">
                Age
              </span>{" "}
              <input
                value={age}
                onChange={(e) =>
                  setAge(e.target.value === "" ? "" : Number(e.target.value))
                }
                type="number"
                min={0}
                max={130}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 42"
              />{" "}
            </label>{" "}
          </div>
        )}{" "}
        {mode === "doctor" ? (
          <div className="pt-2 space-y-3">
            {" "}
            <div>
              {" "}
              <h2 className="text-sm font-semibold text-gray-900">
                Weekly availability
              </h2>{" "}
              <p className="text-xs text-gray-500">
                Patients can only book within these hours (30-min slots).
              </p>{" "}
            </div>{" "}
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              {" "}
              <div className="grid grid-cols-12 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600">
                {" "}
                <div className="col-span-4">Day</div>{" "}
                <div className="col-span-4">From</div>{" "}
                <div className="col-span-4">To</div>{" "}
              </div>{" "}
              <div className="divide-y">
                {" "}
                {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
                  const dayNames = [
                    "Sun",
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat",
                  ];
                  const row =
                    availability.find((r) => r.dayOfWeek === dow) ?? null;
                  const enabled = Boolean(row);
                  const startTime = row?.startTime ?? "09:00";
                  const endTime = row?.endTime ?? "17:00";
                  return (
                    <div
                      key={dow}
                      className="grid grid-cols-12 items-center px-4 py-3 gap-3"
                    >
                      {" "}
                      <div className="col-span-4 flex items-center gap-3">
                        {" "}
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) => {
                            setAvailability((prev) => {
                              if (e.target.checked) {
                                return [
                                  ...prev,
                                  {
                                    dayOfWeek: dow,
                                    startTime: "09:00",
                                    endTime: "17:00",
                                  },
                                ].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
                              }
                              return prev.filter((p) => p.dayOfWeek !== dow);
                            });
                          }}
                        />{" "}
                        <span className="text-sm font-medium text-gray-900">
                          {dayNames[dow]}
                        </span>{" "}
                      </div>{" "}
                      <div className="col-span-4">
                        {" "}
                        <select
                          value={startTime}
                          disabled={!enabled}
                          onChange={(e) => {
                            const v = e.target.value;
                            setAvailability((prev) =>
                              prev.map((p) =>
                                p.dayOfWeek === dow
                                  ? { ...p, startTime: v }
                                  : p,
                              ),
                            );
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white disabled:bg-gray-50 disabled:text-gray-400"
                        >
                          {" "}
                          {timeOptions.map((t) => (
                            <option key={t} value={t}>
                              {" "}
                              {t}{" "}
                            </option>
                          ))}{" "}
                        </select>{" "}
                      </div>{" "}
                      <div className="col-span-4">
                        {" "}
                        <select
                          value={endTime}
                          disabled={!enabled}
                          onChange={(e) => {
                            const v = e.target.value;
                            setAvailability((prev) =>
                              prev.map((p) =>
                                p.dayOfWeek === dow ? { ...p, endTime: v } : p,
                              ),
                            );
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white disabled:bg-gray-50 disabled:text-gray-400"
                        >
                          {" "}
                          {timeOptions.map((t) => (
                            <option key={t} value={t}>
                              {" "}
                              {t}{" "}
                            </option>
                          ))}{" "}
                        </select>{" "}
                      </div>{" "}
                    </div>
                  );
                })}{" "}
              </div>{" "}
            </div>{" "}
            <div className="flex items-center justify-between">
              {" "}
              <div className="text-xs text-gray-500">
                {" "}
                {loadingAvailability
                  ? "Loading existing schedule..."
                  : "Tip: set Mon–Sun hours, leave unchecked to disable a day."}{" "}
              </div>{" "}
              <button
                type="button"
                onClick={() => void onSaveAvailability()}
                disabled={savingAvailability || uploadingAvatar || saving}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-black disabled:opacity-50"
              >
                {" "}
                {savingAvailability ? "Saving..." : "Save availability"}{" "}
              </button>{" "}
            </div>{" "}
          </div>
        ) : null}{" "}
        <div className="flex items-center justify-end gap-3 pt-2">
          {" "}
          <button
            type="submit"
            disabled={!canSave || saving || uploadingAvatar}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {" "}
            {saving ? "Saving..." : "Save changes"}{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
    </form>
  );
}
