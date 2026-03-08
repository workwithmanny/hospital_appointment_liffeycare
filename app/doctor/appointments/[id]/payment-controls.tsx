"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { CheckCircle2, XCircle } from "lucide-react";
type PaymentMethod = "pay_at_clinic" | "stripe" | "dummy_online" | string;
type PaymentStatus = "pending" | "paid" | "refunded" | string;
export function PaymentControls({
  appointmentId,
  initialStatus,
  method,
}: {
  appointmentId: string;
  initialStatus: PaymentStatus;
  method: PaymentMethod;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();
  if (method !== "pay_at_clinic") return null;
  async function updateStatus(newStatus: "paid" | "pending") {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/doctor/appointments/${appointmentId}/payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed up update payment");
      toast.push({
        kind: "success",
        title: "Order Updated",
        message: `Appointment marked as ${newStatus}.`,
        ttlMs: 3000,
      });
      router.refresh();
    } catch (e) {
      toast.push({
        kind: "error",
        title: "Error",
        message: e instanceof Error ? e.message : "Unexpected error",
        ttlMs: 4500,
      });
    } finally {
      setLoading(false);
    }
  }
  const isPaid = initialStatus === "paid";
  return (
    <div className="mt-4 flex animate-in fade-in slide-in-from-top-2 duration-300">
      {" "}
      {!isPaid ? (
        <button
          onClick={() => updateStatus("paid")}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-all active:scale-95"
        >
          {" "}
          <CheckCircle2 className="h-4 w-4" />{" "}
          {loading ? "Updating..." : "Mark as Paid at Clinic"}{" "}
        </button>
      ) : (
        <button
          onClick={() => updateStatus("pending")}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-all active:scale-95"
        >
          {" "}
          <XCircle className="h-4 w-4" />{" "}
          {loading ? "Updating..." : "Mark as Unpaid"}{" "}
        </button>
      )}{" "}
    </div>
  );
}
