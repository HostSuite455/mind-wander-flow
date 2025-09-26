import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  Filter, 
  Calendar as CalendarIcon, 
  X, 
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

export interface CalendarFiltersState {
  searchQuery: string;
  selectedProperties: string[];
  bookingStatus: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  guestCountRange: {
    min: number | null;
    max: number | null;
  };
  priceRange: {
    min: number | null;
    max: number | null;
  };
  channels: string[];
  sortBy: 'check_in' | 'created_at' | 'guest_name' | 'total_price';
  sortOrder: 'asc' | 'desc';
}

interface Property {
  id: string;
  name: string;
}

interface CalendarFiltersProps {
  filters: CalendarFiltersState;
  onFiltersChange: (filters: CalendarFiltersState) => void;
  properties: Property[];
  availableChannels: string[];
  availableStatuses: string[];
  isOpen: boolean;
  onToggle: () => void;
}

const defaultFilters: CalendarFiltersState = {
  searchQuery: '',
  selectedProperties: [],
  bookingStatus: [],
  dateRange: { from: null, to: null },
  guestCountRange: { min: null, max: null },
  priceRange: { min: null, max: null },
  channels: [],
  sortBy: 'check_in',
  sortOrder: 'asc'
};

export function CalendarFilters({
  filters,
  onFiltersChange,
  properties,
  availableChannels,
  availableStatuses,
  isOpen,
  onToggle
}: CalendarFiltersProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const updateFilters = (updates: Partial<CalendarFiltersState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const resetFilters = () => {
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters = () => {
    return (
      filters.searchQuery ||
      filters.selectedProperties.length > 0 ||
      filters.bookingStatus.length > 0 ||
      filters.dateRange.from ||
      filters.dateRange.to ||
      filters.guestCountRange.min !== null ||
      filters.guestCountRange.max !== null ||
      filters.priceRange.min !== null ||
      filters.priceRange.max !== null ||
      filters.channels.length > 0
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.selectedProperties.length > 0) count++;
    if (filters.bookingStatus.length > 0) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.guestCountRange.min !== null || filters.guestCountRange.max !== null) count++;
    if (filters.priceRange.min !== null || filters.priceRange.max !== null) count++;
    if (filters.channels.length > 0) count++;
    return count;
  };

  const togglePropertyFilter = (propertyId: string) => {
    const newSelected = filters.selectedProperties.includes(propertyId)
      ? filters.selectedProperties.filter(id => id !== propertyId)
      : [...filters.selectedProperties, propertyId];
    updateFilters({ selectedProperties: newSelected });
  };

  const toggleStatusFilter = (status: string) => {
    const newSelected = filters.bookingStatus.includes(status)
      ? filters.bookingStatus.filter(s => s !== status)
      : [...filters.bookingStatus, status];
    updateFilters({ bookingStatus: newSelected });
  };

  const toggleChannelFilter = (channel: string) => {
    const newSelected = filters.channels.includes(channel)
      ? filters.channels.filter(c => c !== channel)
      : [...filters.channels, channel];
    updateFilters({ channels: newSelected });
  };

  const setQuickDateRange = (type: 'thisMonth' | 'nextMonth' | 'lastMonth' | 'next3Months') => {
    const now = new Date();
    let from: Date, to: Date;

    switch (type) {
      case 'thisMonth':
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case 'nextMonth':
        from = startOfMonth(addMonths(now, 1));
        to = endOfMonth(addMonths(now, 1));
        break;
      case 'lastMonth':
        from = startOfMonth(subMonths(now, 1));
        to = endOfMonth(subMonths(now, 1));
        break;
      case 'next3Months':
        from = startOfMonth(now);
        to = endOfMonth(addMonths(now, 2));
        break;
    }

    updateFilters({ dateRange: { from, to } });
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        onClick={onToggle}
        className="relative"
      >
        <Filter className="w-4 h-4 mr-2" />
        Filtri
        {hasActiveFilters() && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {getActiveFiltersCount()}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtri Calendario
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-muted-foreground"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Ricerca</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              id="search"
              placeholder="Cerca per nome ospite, email, riferimento..."
              value={filters.searchQuery}
              onChange={(e) => updateFilters({ searchQuery: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Properties */}
        <div className="space-y-3">
          <Label>Proprietà</Label>
          <div className="flex flex-wrap gap-2">
            {properties.map((property) => (
              <Badge
                key={property.id}
                variant={filters.selectedProperties.includes(property.id) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => togglePropertyFilter(property.id)}
              >
                {property.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Booking Status */}
        <div className="space-y-3">
          <Label>Stato Prenotazione</Label>
          <div className="flex flex-wrap gap-2">
            {availableStatuses.map((status) => (
              <Badge
                key={status}
                variant={filters.bookingStatus.includes(status) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleStatusFilter(status)}
              >
                {status.toUpperCase()}
              </Badge>
            ))}
          </div>
        </div>

        {/* Channels */}
        <div className="space-y-3">
          <Label>Canali</Label>
          <div className="flex flex-wrap gap-2">
            {availableChannels.map((channel) => (
              <Badge
                key={channel}
                variant={filters.channels.includes(channel) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleChannelFilter(channel)}
              >
                {channel}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Date Range */}
        <div className="space-y-3">
          <Label>Periodo</Label>
          <div className="flex flex-wrap gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateRange('thisMonth')}
            >
              Questo Mese
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateRange('nextMonth')}
            >
              Prossimo Mese
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateRange('next3Months')}
            >
              Prossimi 3 Mesi
            </Button>
          </div>
          
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange.from ? (
                  filters.dateRange.to ? (
                    <>
                      {format(filters.dateRange.from, "dd MMM yyyy", { locale: it })} -{" "}
                      {format(filters.dateRange.to, "dd MMM yyyy", { locale: it })}
                    </>
                  ) : (
                    format(filters.dateRange.from, "dd MMM yyyy", { locale: it })
                  )
                ) : (
                  <span>Seleziona periodo</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={filters.dateRange.from || new Date()}
                selected={{
                  from: filters.dateRange.from || undefined,
                  to: filters.dateRange.to || undefined,
                }}
                onSelect={(range) => {
                  updateFilters({
                    dateRange: {
                      from: range?.from || null,
                      to: range?.to || null,
                    }
                  });
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Guest Count Range */}
        <div className="space-y-3">
          <Label>Numero Ospiti</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="min-guests" className="text-sm text-muted-foreground">Min</Label>
              <Input
                id="min-guests"
                type="number"
                min="1"
                placeholder="1"
                value={filters.guestCountRange.min || ''}
                onChange={(e) => updateFilters({
                  guestCountRange: {
                    ...filters.guestCountRange,
                    min: e.target.value ? parseInt(e.target.value) : null
                  }
                })}
              />
            </div>
            <div>
              <Label htmlFor="max-guests" className="text-sm text-muted-foreground">Max</Label>
              <Input
                id="max-guests"
                type="number"
                min="1"
                placeholder="10"
                value={filters.guestCountRange.max || ''}
                onChange={(e) => updateFilters({
                  guestCountRange: {
                    ...filters.guestCountRange,
                    max: e.target.value ? parseInt(e.target.value) : null
                  }
                })}
              />
            </div>
          </div>
        </div>

        {/* Price Range */}
        <div className="space-y-3">
          <Label>Fascia di Prezzo (€)</Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="min-price" className="text-sm text-muted-foreground">Min</Label>
              <Input
                id="min-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={filters.priceRange.min || ''}
                onChange={(e) => updateFilters({
                  priceRange: {
                    ...filters.priceRange,
                    min: e.target.value ? parseFloat(e.target.value) : null
                  }
                })}
              />
            </div>
            <div>
              <Label htmlFor="max-price" className="text-sm text-muted-foreground">Max</Label>
              <Input
                id="max-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="1000.00"
                value={filters.priceRange.max || ''}
                onChange={(e) => updateFilters({
                  priceRange: {
                    ...filters.priceRange,
                    max: e.target.value ? parseFloat(e.target.value) : null
                  }
                })}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Sorting */}
        <div className="space-y-3">
          <Label>Ordinamento</Label>
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={filters.sortBy}
              onValueChange={(value: any) => updateFilters({ sortBy: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="check_in">Data Check-in</SelectItem>
                <SelectItem value="created_at">Data Creazione</SelectItem>
                <SelectItem value="guest_name">Nome Ospite</SelectItem>
                <SelectItem value="total_price">Prezzo Totale</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.sortOrder}
              onValueChange={(value: any) => updateFilters({ sortOrder: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Crescente</SelectItem>
                <SelectItem value="desc">Decrescente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}