import { CheckCircle, Clock, AlertTriangle, XCircle } from "lucide-react";

type Status = "Compliant" | "In Progress" | "Violation" | "Overdue" | "Pending";

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "md";
}

const statusConfig: Record<
  Status,
  {
    bg: string;
    text: string;
    icon: React.ComponentType<{ className?: string }> | null;
  }
> = {
  Compliant: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: CheckCircle,
  },
  "In Progress": {
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: Clock,
  },
  Violation: {
    bg: "bg-red-50",
    text: "text-red-700",
    icon: AlertTriangle,
  },
  Overdue: {
    bg: "bg-red-100",
    text: "text-red-800",
    icon: XCircle,
  },
  Pending: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    icon: null,
  },
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = statusConfig[status];
  const IconComponent = config.icon;

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[10px] gap-1"
      : "px-2.5 py-1 text-xs gap-1.5";

  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.bg} ${config.text} ${sizeClasses}`}
    >
      {IconComponent && <IconComponent className={iconSize} />}
      {status}
    </span>
  );
}
