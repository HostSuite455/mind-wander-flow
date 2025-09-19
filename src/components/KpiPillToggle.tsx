import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface KpiPillToggleProps {
  value: 'all' | 'active';
  onChange: (value: 'all' | 'active') => void;
  activePropertyName?: string;
  className?: string;
}

export default function KpiPillToggle({ value, onChange, activePropertyName, className }: KpiPillToggleProps) {
  return (
    <div className={cn("flex items-center gap-1 p-1 bg-muted rounded-lg", className)}>
      <Button
        size="sm"
        variant={value === 'all' ? 'default' : 'ghost'}
        onClick={() => onChange('all')}
        className={cn(
          "h-7 px-3 text-xs font-medium transition-all",
          value === 'all' 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        )}
      >
        Tutte le proprietà
      </Button>
      <Button
        size="sm"
        variant={value === 'active' ? 'default' : 'ghost'}
        onClick={() => onChange('active')}
        disabled={!activePropertyName}
        className={cn(
          "h-7 px-3 text-xs font-medium transition-all",
          value === 'active' 
            ? "bg-background text-foreground shadow-sm" 
            : "text-muted-foreground hover:text-foreground hover:bg-background/50",
          !activePropertyName && "opacity-50 cursor-not-allowed"
        )}
      >
        Solo attiva
      </Button>
    </div>
  );
}