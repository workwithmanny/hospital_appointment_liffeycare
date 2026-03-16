"use client";
import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
interface CancellationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isCancelling: boolean;
  appointmentInfo: {
    doctorName?: string;
    patientName?: string;
    date: string;
    time: string;
  };
  userType: "patient" | "doctor";
}
export function CancellationDialog({
  isOpen,
  onClose,
  onConfirm,
  isCancelling,
  appointmentInfo,
  userType,
}: CancellationDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  if (!isOpen) return null;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 3) {
      setError("Please provide a reason (minimum 3 characters)");
      return;
    }
    setError("");
    onConfirm(reason.trim());
  };
  const otherPersonName =
    userType === "patient"
      ? appointmentInfo.doctorName
      : appointmentInfo.patientName;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {" "}
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
        {" "}
        <button
          onClick={onClose}
          disabled={isCancelling}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 disabled:opacity-50"
        >
          {" "}
          <X className="w-5 h-5" />{" "}
        </button>{" "}
        <div className="flex items-center gap-3 mb-4">
          {" "}
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            {" "}
            <AlertTriangle className="w-5 h-5 text-red-600" />{" "}
          </div>{" "}
          <div>
            {" "}
            <h2 className="text-lg font-semibold text-slate-900">
              Cancel Appointment
            </h2>{" "}
            <p className="text-sm text-slate-600">
              {" "}
              {userType === "patient"
                ? "Are you sure you want to cancel this appointment?"
                : "Are you sure you want to cancel this appointment?"}{" "}
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <div className="bg-slate-50 rounded-lg p-3 mb-4">
          {" "}
          <p className="text-sm font-medium text-slate-900 mb-1">
            Appointment Details:
          </p>{" "}
          <div className="text-sm text-slate-600 space-y-1">
            {" "}
            <p>
              <span className="font-medium">With:</span> {otherPersonName}
            </p>{" "}
            <p>
              <span className="font-medium">Date:</span> {appointmentInfo.date}
            </p>{" "}
            <p>
              <span className="font-medium">Time:</span> {appointmentInfo.time}
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <form onSubmit={handleSubmit} className="space-y-4">
          {" "}
          <div>
            {" "}
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              {" "}
              Reason for cancellation *{" "}
            </label>{" "}
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
              placeholder="Please explain why you need to cancel this appointment..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={3}
              disabled={isCancelling}
              required
            />{" "}
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}{" "}
          </div>{" "}
          <div className="flex gap-3 pt-2">
            {" "}
            <button
              type="button"
              onClick={onClose}
              disabled={isCancelling}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {" "}
              Keep Appointment{" "}
            </button>{" "}
            <button
              type="submit"
              disabled={isCancelling}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {" "}
              {isCancelling ? (
                <>
                  {" "}
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                  Cancelling...{" "}
                </>
              ) : (
                "Cancel Appointment"
              )}{" "}
            </button>{" "}
          </div>{" "}
        </form>{" "}
      </div>{" "}
    </div>
  );
}
