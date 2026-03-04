import Link from "next/link";
import { CopyButton } from "@/components/ui/copy-button";
import { assertRole } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  Calendar,
  FileText,
  MessageCircle,
  Stethoscope,
  ArrowLeft,
  Mail,
  Phone,
  Building2,
} from "lucide-react";
import { specialtyLabel } from "@/lib/constants/specialties";
import {
  CLINICAL_NOTE_FIELDS,
  clinicalFieldLabel,
  extraClinicalKeys,
  parseClinicalNotes,
} from "@/lib/appointments/clinical-notes";
import { ChatInitiationButton } from "@/components/ChatInitiationButton";
export default async function PatientAppointmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getSessionUser();
  assertRole(user, ["patient"]);
  const supabase = getSupabaseServerClient();
  const { data: appt, error } = await supabase
    .from("appointments")
    .select(
      `id, slot_time, status, session_notes, clinical_notes, payment_status, payment_method, amount_paid, stripe_transaction_id, parent_appointment_id, doctor:profiles!appointments_doctor_id_fkey(id, full_name, specialty, avatar_url, phone, hospital)`,
    )
    .eq("id", params.id)
    .eq("patient_id", user!.id)
    .single();
  if (error || !appt) notFound();
  const doctor = appt.doctor as any;
  const doctorRow = doctor && !Array.isArray(doctor) ? doctor : null;
  const clinical = parseClinicalNotes(appt.clinical_notes);
  const additionalClinicalKeys = extraClinicalKeys(clinical);
  const { data: messages } = await supabase
    .from("messages")
    .select(
      `id, body, created_at, attachments:message_attachments(file_name, file_path)`,
    )
    .eq("appointment_id", params.id)
    .order("created_at", { ascending: true });
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const files =
    (messages ?? []).flatMap((m) => {
      const atts =
        (m as { attachments?: Array<{ file_name: string; file_path: string }> })
          .attachments ?? [];
      return atts.map((a) => ({
        fileName: a.file_name,
        url: `${baseUrl}/storage/v1/object/public/message-files/${a.file_path}`,
        messageAt: (m as { created_at: string }).created_at,
      }));
    }) ?? [];
  const canJoinSession =
    appt.status === "scheduled" || appt.status === "in_progress";
  return (
    <div className="p-8 max-w-3xl">
      {" "}
      <Link
        href="/patient/appointments"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:underline"
      >
        {" "}
        <ArrowLeft className="h-4 w-4" /> Back to appointments{" "}
      </Link>{" "}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        {" "}
        <div className="flex flex-wrap items-start justify-between gap-4">
          {" "}
          <div>
            {" "}
            <h1 className="text-xl font-semibold text-gray-900">
              Appointment
            </h1>{" "}
            <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
              {" "}
              <Calendar className="h-4 w-4" />{" "}
              {new Date(appt.slot_time).toLocaleString()}{" "}
            </p>{" "}
            <p className="mt-2 text-sm">
              {" "}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 capitalize text-slate-800">
                {appt.status}
              </span>{" "}
              {appt.payment_status ? (
                <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-blue-800">
                  {appt.payment_status}
                </span>
              ) : null}{" "}
            </p>{" "}
          </div>{" "}
          {doctorRow ? (
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-200">
                {doctorRow.avatar_url ? ( // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={doctorRow.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Dr. {doctorRow.full_name}
                </p>
                <p className="text-sm text-gray-600">
                  {specialtyLabel(doctorRow.specialty) ?? doctorRow.specialty}
                </p>
                {doctorRow.hospital && (
                  <p className="text-sm text-indigo-600 flex items-center gap-1 mt-0.5">
                    <Building2 className="h-3.5 w-3.5" />
                    {doctorRow.hospital}
                  </p>
                )}
              </div>
            </div>
          ) : null}{" "}
        </div>{" "}
        <div className="mt-6 space-y-4">
          {" "}
          <div>
            {" "}
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
              {" "}
              <FileText className="h-4 w-4" /> Visit notes{" "}
            </h2>{" "}
            <p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
              {" "}
              {appt.session_notes?.trim()
                ? appt.session_notes
                : "No notes recorded for this visit yet."}{" "}
            </p>{" "}
          </div>{" "}
          <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-4">
            {" "}
            <h2 className="mb-3 text-sm font-semibold text-gray-800">
              Payment information
            </h2>{" "}
            <div className="grid grid-cols-2 gap-y-3 text-xs sm:grid-cols-4">
              {" "}
              <div>
                {" "}
                <p className="text-gray-500 font-medium">Status</p>{" "}
                <p
                  className={`mt-0.5 font-bold uppercase tracking-tight ${appt.payment_status === "paid" ? "text-emerald-700" : "text-amber-700"}`}
                >
                  {" "}
                  {appt.payment_status || "Pending"}{" "}
                </p>{" "}
              </div>{" "}
              <div>
                {" "}
                <p className="text-gray-500 font-medium">Method</p>{" "}
                <p className="mt-0.5 font-bold text-gray-800 uppercase tabular-nums">
                  {" "}
                  {String(appt.payment_method || "N/A").replace(/_/g, " ")}{" "}
                </p>{" "}
              </div>{" "}
              <div>
                {" "}
                <p className="text-gray-500 font-medium">Money Out</p>{" "}
                <p className="mt-0.5 font-bold text-gray-900 tabular-nums">
                  {" "}
                  ${Number(appt.amount_paid || 0).toFixed(2)}{" "}
                </p>{" "}
              </div>{" "}
              <div>
                {" "}
                <p className="text-gray-500 font-medium">Transaction ID</p>{" "}
                <div className="mt-0.5 flex items-center">
                  {" "}
                  <span className="font-mono text-xs text-gray-700 break-all select-all">
                    {" "}
                    {appt.stripe_transaction_id || "—"}{" "}
                  </span>{" "}
                  {appt.stripe_transaction_id && (
                    <CopyButton text={appt.stripe_transaction_id} />
                  )}{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          <div>
            {" "}
            <h2 className="mb-2 text-sm font-semibold text-gray-800">
              Clinical notes
            </h2>{" "}
            <dl className="space-y-4 rounded-lg border border-gray-100 bg-white p-4 text-sm">
              {" "}
              {CLINICAL_NOTE_FIELDS.map(([key, label]) => {
                const v = clinical[key]?.trim() ?? "";
                return (
                  <div key={key}>
                    {" "}
                    <dt className="font-medium text-gray-800">{label}</dt>{" "}
                    <dd className="mt-1 whitespace-pre-wrap rounded-md bg-gray-50 px-3 py-2 text-gray-900">
                      {" "}
                      {v || "—"}{" "}
                    </dd>{" "}
                  </div>
                );
              })}{" "}
              {additionalClinicalKeys.length > 0 ? (
                <div className="border-t border-gray-100 pt-4">
                  {" "}
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Additional fields
                  </p>{" "}
                  <div className="space-y-4">
                    {" "}
                    {additionalClinicalKeys.map((k) => (
                      <div key={k}>
                        {" "}
                        <dt className="font-medium text-gray-800">
                          {clinicalFieldLabel(k)}
                        </dt>{" "}
                        <dd className="mt-1 whitespace-pre-wrap rounded-md bg-gray-50 px-3 py-2 text-gray-900">
                          {" "}
                          {clinical[k]?.trim() ? clinical[k] : "—"}{" "}
                        </dd>{" "}
                      </div>
                    ))}{" "}
                  </div>{" "}
                </div>
              ) : null}{" "}
            </dl>{" "}
          </div>{" "}
          <div>
            {" "}
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
              {" "}
              <MessageCircle className="h-4 w-4" /> Files from chat{" "}
            </h2>{" "}
            {files.length === 0 ? (
              <p className="text-sm text-gray-500">
                No files were attached in this appointment.
              </p>
            ) : (
              <ul className="space-y-2">
                {" "}
                {files.map((f) => (
                  <li key={`${f.url}-${f.fileName}`}>
                    {" "}
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-blue-700 hover:underline"
                    >
                      {" "}
                      {f.fileName}{" "}
                    </a>{" "}
                    <span className="ml-2 text-xs text-gray-400">
                      {new Date(f.messageAt).toLocaleString()}
                    </span>{" "}
                  </li>
                ))}{" "}
              </ul>
            )}{" "}
          </div>{" "}
          <div className="flex flex-wrap gap-3 pt-4">
            {" "}
            {canJoinSession ? (
              <Link
                href={`/patient/session/${params.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {" "}
                <Stethoscope className="h-4 w-4" />{" "}
                {appt.status === "in_progress"
                  ? "Continue Session"
                  : "Open session"}{" "}
              </Link>
            ) : null}{" "}
            {doctorRow ? (
              <Link
                href={`/patient/booking?doctorId=${doctorRow.id}&followUpFrom=${params.id}`}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                {" "}
                Book follow-up{" "}
              </Link>
            ) : null}{" "}
            <Link
              href="/patient/chat"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <MessageCircle className="h-4 w-4" />
              Go to chat
            </Link>
            {doctorRow && (
              <ChatInitiationButton
                recipientId={doctorRow.id}
                recipientName={doctorRow.full_name}
                recipientType="doctor"
              />
            )}{" "}
            {doctorRow && (
              <>
                {doctorRow.phone ? (
                  <a
                    href={`tel:${doctorRow.phone}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    title="Call doctor"
                  >
                    <Phone className="h-4 w-4" /> Call
                  </a>
                ) : null}
              </>
            )}{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
