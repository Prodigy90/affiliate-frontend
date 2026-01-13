type StatusBadgeProps = {
  status: string;
  variant?: "commission" | "payout";
};

export function StatusBadge({ status, variant = "commission" }: StatusBadgeProps) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize";

  const getColorClass = () => {
    // Green for success states
    if (
      status === "credited" ||
      status === "completed"
    ) {
      return "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/40";
    }

    // Yellow for pending/processing states
    if (
      status === "pending" ||
      status === "processing"
    ) {
      return "bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/40";
    }

    // Red for error/rejected/refunded states
    if (
      status === "refunded" ||
      status === "reversed" ||
      status === "failed" ||
      status === "rejected"
    ) {
      return "bg-red-500/10 text-red-300 ring-1 ring-red-500/40";
    }

    // Default gray
    return "bg-slate-700/60 text-slate-200 ring-1 ring-slate-600/60";
  };

  return <span className={`${base} ${getColorClass()}`}>{status}</span>;
}
