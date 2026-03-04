import { assertRole } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PatientScheduleClient } from "./PatientScheduleClient";
export default async function PatientAppointmentsPage() {
  const user = await getSessionUser();
  assertRole(user, ["patient"]);
  const supabase = getSupabaseServerClient(); // First, let's try to get appointments without the doctor join
  const { data: appointmentsBasic, error: errorBasic } = await supabase
    .from("appointments")
    .select(
      "id, slot_time, status, payment_status, amount_paid, session_notes, doctor_id, cancellation_reason, cancelled_by, cancelled_at",
    )
    .eq("patient_id", user?.id ?? "")
    .order("slot_time", { ascending: false }); // If we have appointments, try to get doctor info separately
  let appointmentsWithDoctor: any[] = [];
  if (appointmentsBasic && appointmentsBasic.length > 0) {
    const doctorIds = [
      ...new Set(appointmentsBasic.map((apt) => apt.doctor_id)),
    ];
    const cancelledByIds = [
      ...new Set(
        appointmentsBasic.map((apt) => apt.cancelled_by).filter(Boolean),
      ),
    ];
    const { data: doctors } = await supabase
      .from("profiles")
      .select("id, full_name, specialty, avatar_url")
      .in("id", doctorIds);
    const { data: cancelledByUsers } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("id", cancelledByIds);
    appointmentsWithDoctor = appointmentsBasic.map((apt) => ({
      id: apt.id,
      slot_time: apt.slot_time,
      status: apt.status,
      payment_status: apt.payment_status,
      amount_paid: apt.amount_paid,
      session_notes: apt.session_notes,
      cancellation_reason: apt.cancellation_reason,
      cancelled_by: apt.cancelled_by,
      cancelled_at: apt.cancelled_at,
      cancelled_by_user:
        cancelledByUsers?.find((user) => user.id === apt.cancelled_by) || null,
      doctor: doctors?.find((doc) => doc.id === apt.doctor_id) || null,
    }));
  } // If no appointments and in development, show a message about creating sample data
  if (
    process.env.NODE_ENV === "development" &&
    appointmentsWithDoctor.length === 0
  ) {
    return (
      <div className="p-8">
        {" "}
        <div className="max-w-2xl mx-auto">
          {" "}
          <div className="bg-white p-8 rounded-xl border border-gray-200 text-center">
            {" "}
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              No Appointments Found
            </h2>{" "}
            <p className="text-gray-600 mb-6">
              {" "}
              You don't have any appointments yet. This could be because you
              haven't booked any, or there might be an issue with the database
              connection.{" "}
            </p>{" "}
            <div className="space-y-4">
              {" "}
              <div className="bg-blue-50 p-4 rounded-lg">
                {" "}
                <h3 className="font-medium text-blue-900 mb-2">
                  For Testing Purposes
                </h3>{" "}
                <p className="text-blue-700 text-sm mb-4">
                  {" "}
                  You can create a sample appointment to test the
                  interface:{" "}
                </p>{" "}
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/seed-appointment", {
                        method: "POST",
                      });
                      const result = await response.json();
                      if (response.ok) {
                        alert(
                          "Sample appointment created! Refresh the page to see it.",
                        );
                        window.location.reload();
                      } else {
                        alert("Error: " + result.error);
                      }
                    } catch (error) {
                      alert("Error creating sample appointment");
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {" "}
                  Create Sample Appointment{" "}
                </button>{" "}
              </div>{" "}
              <div className="bg-gray-50 p-4 rounded-lg">
                {" "}
                <h3 className="font-medium text-gray-900 mb-2">
                  Debug Information
                </h3>{" "}
                <div className="text-left text-sm text-gray-600 space-y-1">
                  {" "}
                  <p>Patient ID: {user?.id}</p>{" "}
                  <p>Appointments found: {appointmentsBasic?.length || 0}</p>{" "}
                  <p>Error: {errorBasic?.message || "None"}</p>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>
    );
  }
  return <PatientScheduleClient appointments={appointmentsWithDoctor} />;
}
