import * as React from "react";
import { cn } from "@/lib/utils";

interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  headerBorder?: boolean;
}

export function DashboardCard({
  title,
  description,
  action,
  icon: Icon,
  headerBorder = true,
  children,
  className,
  ...props
}: DashboardCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "flex items-start justify-between gap-4 px-5 py-4 sm:px-6",
          headerBorder && "border-b border-border"
        )}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-muted text-indigo-600">
                <Icon className="h-4 w-4" />
              </div>
            )}
            <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
              {title}
            </h2>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground sm:text-sm leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}
