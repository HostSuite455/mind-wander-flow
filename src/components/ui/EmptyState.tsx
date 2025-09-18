import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export const EmptyState = ({
  icon,
  title,
  description,
  children,
  className
}: EmptyStateProps) => {
  return (
    <div className={cn("text-center py-8", className)}>
      {icon && (
        <div className="flex justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-hostsuite-text mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-hostsuite-text/60 mb-6">
          {description}
        </p>
      )}
      {children}
    </div>
  );
};