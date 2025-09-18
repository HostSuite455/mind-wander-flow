import { useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Property = { id: string; nome: string };

interface PropertySwitchProps {
  value: string | 'all';
  onChange: (id: string | 'all') => void;
  items: Property[];
  className?: string;
  label?: string;
  storageKey?: string;
}

export default function PropertySwitch({
  value,
  onChange,
  items,
  className,
  label = "Proprietà",
  storageKey = "active_property_id"
}: PropertySwitchProps) {
  // Save to localStorage when value changes (if storageKey provided)
  useEffect(() => {
    if (storageKey && value !== 'all') {
      localStorage.setItem(storageKey, value);
    } else if (storageKey && value === 'all') {
      localStorage.removeItem(storageKey);
    }
  }, [value, storageKey]);

  // Sort properties by name
  const sortedItems = [...items].sort((a, b) => a.nome.localeCompare(b.nome));

  const handleValueChange = (newValue: string) => {
    onChange(newValue === 'all' ? 'all' : newValue);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="property-select" className="text-sm font-medium text-hostsuite-text">
        {label}
      </Label>
      <Select
        value={value}
        onValueChange={handleValueChange}
      >
        <SelectTrigger
          id="property-select"
          className="w-full focus:ring-2 focus:ring-hostsuite-primary/20 focus:border-hostsuite-primary"
          aria-label="Filtra per proprietà"
        >
          <SelectValue placeholder="Seleziona proprietà" />
        </SelectTrigger>
        <SelectContent className="z-50 bg-background border border-hostsuite-primary/20">
          <SelectItem value="all" className="hover:bg-hostsuite-primary/10">
            Tutte le proprietà
          </SelectItem>
          {sortedItems.map((property) => (
            <SelectItem
              key={property.id}
              value={property.id}
              className="hover:bg-hostsuite-primary/10"
            >
              {property.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}