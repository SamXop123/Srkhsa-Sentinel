import { CheckCircle, Clock, AlertTriangle, XCircle } from "lucide-react";

type ComplianceStatus = "Compliant" | "In Progress" | "Violation" | "Overdue";

interface ComplianceStatusPillProps {
  status: ComplianceStatus;
}

const pillConfig: Record<
  ComplianceStatus,
  {
    bg: string;
    text: string;
    icon: React.ComponentType<{ className?: string }>;
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
};

export function ComplianceStatusPill({ status }: ComplianceStatusPillProps) {
  const config = pillConfig[status];
  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-tight ${config.bg} ${config.text}`}
    >
      <IconComponent className="h-3 w-3" />
      {status}
    </span>
  );
}
