import type { LucideIcon } from "lucide-react";

type AgentStatus = "idle" | "running" | "completed" | "error";

interface AgentStatusIndicatorProps {
  name: string;
  description: string;
  icon: LucideIcon;
  status: AgentStatus;
  badge?: string;
}

function StatusDot({ status }: { status: AgentStatus }) {
  if (status === "running") {
    return (
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
      </span>
    );
  }

  if (status === "completed") {
    return <span className="inline-flex h-3 w-3 rounded-full bg-emerald-500" />;
  }

  if (status === "error") {
    return <span className="inline-flex h-3 w-3 rounded-full bg-red-500" />;
  }

  return <span className="inline-flex h-3 w-3 rounded-full bg-slate-300" />;
}

export function AgentStatusIndicator({
  name,
  description,
  icon: Icon,
  status,
  badge,
}: AgentStatusIndicatorProps) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
          <Icon className="h-4 w-4 text-slate-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{name}</span>
            {badge && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <StatusDot status={status} />
    </div>
  );
}
