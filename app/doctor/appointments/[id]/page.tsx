import Link from "next/link";
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
} from "lucide-react";
import {
  CLINICAL_NOTE_FIELDS,
  clinicalFieldLabel,
  extraClinicalKeys,
  parseClinicalNotes,
} from "@/lib/appointments/clinical-notes";
import { PaymentControls } from "./payment-controls";
import { CopyButton } from "@/components/ui/copy-button";
export default async function DoctorAppointmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getSessionUser();
  assertRole(user, ["doctor", "admin"]);
  const supabase = getSupabaseServerClient();
  let apptQuery = supabase
    .from("appointments")
    .select(
      `id, slot_time, status, session_notes, clinical_notes, payment_status, payment_method, amount_paid, stripe_transaction_id, parent_appointment_id, patient:profiles!appointments_patient_id_fkey(id, full_name, avatar_url, age, phone)`,
    )
    .eq("id", params.id);
  if (user!.role === "doctor") {
    apptQuery = apptQuery.eq("doctor_id", user!.id);
  }
  const { data: appt, error } = await apptQuery.single();
  if (error || !appt) notFound();
  const patient = appt.patient as any;
  const patientRow = patient && !Array.isArray(patient) ? patient : null;
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
        href="/doctor/appointments"
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
            </p>{" "}
          </div>{" "}
          {patientRow ? (
            <div className="flex items-center gap-3">
              {" "}
              <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-200">
                {" "}
                {patientRow.avatar_url ? ( // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={patientRow.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}{" "}
              </div>{" "}
              <div>
                {" "}
                <p className="font-medium text-gray-900">
                  {patientRow.full_name}
                </p>{" "}
                {patientRow.age != null ? (
                  <p className="text-sm text-gray-600">Age {patientRow.age}</p>
                ) : null}{" "}
              </div>{" "}
            </div>
          ) : null}{" "}
        </div>{" "}
        <div className="mt-6 space-y-4">
          {" "}
          <div>
            {" "}
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
              {" "}
              <FileText className="h-4 w-4" /> Visit summary{" "}
            </h2>{" "}
            <p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
              {" "}
              {appt.session_notes?.trim() ? appt.session_notes : "—"}{" "}
            </p>{" "}
            <p className="mt-2 text-xs text-gray-500">
              {" "}
              Shared visit summary (may include the patient&apos;s original
              reason for booking until updated during the session).{" "}
            </p>{" "}
          </div>{" "}
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
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
                <p className="text-gray-500 font-medium">Income In</p>{" "}
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
                  <span className="font-mono text-gray-700 break-all select-all">
                    {" "}
                    {appt.stripe_transaction_id || "—"}{" "}
                  </span>{" "}
                  {appt.stripe_transaction_id && (
                    <CopyButton text={appt.stripe_transaction_id} />
                  )}{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            {appt.payment_method === "pay_at_clinic" && (
              <PaymentControls
                appointmentId={appt.id}
                initialStatus={appt.payment_status}
                method={appt.payment_method}
              />
            )}{" "}
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
              <p className="text-sm text-gray-500">No files attached.</p>
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
                  </li>
                ))}{" "}
              </ul>
            )}{" "}
          </div>{" "}
          <div className="flex flex-wrap gap-3 pt-4">
            {" "}
            {canJoinSession ? (
              <Link
                href={`/doctor/session/${params.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {" "}
                <Stethoscope className="h-4 w-4" /> Open session{" "}
              </Link>
            ) : null}{" "}
            <Link
              href="/doctor/chat"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {" "}
              Chat{" "}
            </Link>{" "}
            {patientRow && (
              <>
                {patientRow.phone ? (
                  <a
                    href={`tel:${patientRow.phone}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    title="Call patient"
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
