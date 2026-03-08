"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Wallet, ArrowLeft, TrendingUp, TrendingDown, DollarSign, History } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type LedgerRow = {
  id: string;
  appointment_id: string | null;
  amount: number;
  entry_type: string;
  note: string | null;
  created_at: string;
};

export default function DoctorWalletPage() {
  const toast = useToast();
  const [balance, setBalance] = useState<number | null>(null);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/doctor/wallet");
      const data = (await res.json()) as {
        balance?: number;
        ledger?: LedgerRow[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setBalance(data.balance ?? 0);
      setLedger(data.ledger ?? []);
    } catch (e) {
      toast.push({
        kind: "error",
        title: "Wallet",
        message: e instanceof Error ? e.message : "Could not load wallet",
        ttlMs: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function withdraw() {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      toast.push({
        kind: "info",
        title: "Amount",
        message: "Enter a valid amount.",
        ttlMs: 3000,
      });
      return;
    }
    setWithdrawing(true);
    try {
      const res = await fetch("/api/doctor/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: n }),
      });
      const data = (await res.json()) as {
        error?: string;
        newBalance?: number;
      };
      if (!res.ok) throw new Error(data.error ?? "Withdrawal failed");
      toast.push({
        kind: "success",
        title: "Withdrawal recorded",
        message: "Balance updated (demo — connect payouts in production).",
        ttlMs: 4000,
      });
      setAmount("");
      void load();
    } catch (e) {
      toast.push({
        kind: "error",
        title: "Withdrawal",
        message: e instanceof Error ? e.message : "Failed",
        ttlMs: 4000,
      });
    } finally {
      setWithdrawing(false);
    }
  }

  const totalEarnings = ledger
    .filter((r) => r.entry_type === "earning")
    .reduce((acc, r) => acc + Number(r.amount), 0);

  const totalWithdrawals = ledger
    .filter((r) => r.entry_type === "withdrawal")
    .reduce((acc, r) => acc + Number(r.amount), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#14b6a6]/10 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-[#14b6a6]" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold text-text-primary">
            Wallet
          </h1>
          <p className="text-sm text-text-secondary">
            Consultation earnings and withdrawals
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#14b6a6]/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#14b6a6]" />
            </div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              Available Balance
            </p>
          </div>
          <p className="text-2xl sm:text-3xl font-display font-bold text-text-primary">
            {loading ? "—" : `$${(balance ?? 0).toFixed(2)}`}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">
              Total Income
            </p>
          </div>
          <p className="text-2xl sm:text-3xl font-display font-bold text-emerald-600">
            {loading ? "—" : `$${totalEarnings.toFixed(2)}`}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">
              Total Withdrawn
            </p>
          </div>
          <p className="text-2xl sm:text-3xl font-display font-bold text-blue-600">
            {loading ? "—" : `$${totalWithdrawals.toFixed(2)}`}
          </p>
        </div>
      </div>

      {/* Withdrawal Section */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5 sm:p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#14b6a6]/10 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-[#14b6a6]" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">
            Withdraw Funds
          </h3>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">
              Amount (USD)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#14b6a6]/20 focus:border-[#14b6a6]"
              placeholder="0.00"
            />
          </div>
          <button
            type="button"
            disabled={withdrawing || loading}
            onClick={() => void withdraw()}
            className="w-full sm:w-auto rounded-xl bg-[#14b6a6] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#0d9488] disabled:opacity-50 transition-colors shadow-sm"
          >
            {withdrawing ? "Processing…" : "Withdraw"}
          </button>
        </div>
        <p className="mt-3 text-xs text-text-tertiary">
          This is a demo flow: withdrawals deduct your balance and appear in the
          ledger. Connect a real payout provider for production.
        </p>
      </div>

      {/* Ledger */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#14b6a6]/10 flex items-center justify-center">
          <History className="w-4 h-4 text-[#14b6a6]" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary">Transaction History</h2>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {ledger.length === 0 ? (
          <div className="p-8 text-center">
            <History className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
            <p className="text-sm text-text-secondary">No transactions yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-subtle text-xs font-medium text-text-secondary">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ledger.map((row) => (
                  <tr key={row.id} className="hover:bg-subtle/50">
                    <td className="px-4 py-3 text-text-secondary">
                      {new Date(row.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {row.entry_type === "earning" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                          <TrendingUp className="w-3 h-3" />
                          Income
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                          <TrendingDown className="w-3 h-3" />
                          Withdrawal
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        row.entry_type === "earning" ? "text-emerald-600" : "text-blue-600"
                      }`}
                    >
                      {row.entry_type === "earning" ? "+" : "-"} ${Number(row.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {row.note ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
