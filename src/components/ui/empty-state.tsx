import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center animate-fade-in-up",
        className
      )}
      {...props}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background shadow-xs text-indigo-600">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
