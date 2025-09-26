import React, { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { CalendarBooking } from '@/hooks/useCalendarData';
import { useToast } from '@/hooks/use-toast';

interface CalendarExportProps {
  bookings: CalendarBooking[];
  selectedPropertyIds: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
}

type ExportFormat = 'csv' | 'pdf' | 'excel';

interface ExportField {
  key: keyof CalendarBooking | 'property_name' | 'nights' | 'check_in_formatted' | 'check_out_formatted';
  label: string;
  enabled: boolean;
}

const defaultFields: ExportField[] = [
  { key: 'booking_reference', label: 'Riferimento Prenotazione', enabled: true },
  { key: 'guest_name', label: 'Nome Ospite', enabled: true },
  { key: 'guest_email', label: 'Email Ospite', enabled: true },
  { key: 'guest_phone', label: 'Telefono Ospite', enabled: false },
  { key: 'property_name', label: 'Proprietà', enabled: true },
  { key: 'check_in_formatted', label: 'Check-in', enabled: true },
  { key: 'check_out_formatted', label: 'Check-out', enabled: true },
  { key: 'nights', label: 'Notti', enabled: true },
  { key: 'guests_count', label: 'Numero Ospiti', enabled: true },
  { key: 'adults_count', label: 'Adulti', enabled: false },
  { key: 'children_count', label: 'Bambini', enabled: false },
  { key: 'total_price', label: 'Prezzo Totale', enabled: true },
  { key: 'booking_status', label: 'Stato', enabled: true },
  { key: 'channel', label: 'Canale', enabled: true },
  { key: 'special_requests', label: 'Richieste Speciali', enabled: false },
  { key: 'created_at', label: 'Data Creazione', enabled: false },
];

export function CalendarExport({ bookings, selectedPropertyIds, dateRange }: CalendarExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [exportFields, setExportFields] = useState<ExportField[]>(defaultFields);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const toggleField = (fieldKey: string) => {
    setExportFields(fields =>
      fields.map(field =>
        field.key === fieldKey ? { ...field, enabled: !field.enabled } : field
      )
    );
  };

  const selectAllFields = () => {
    setExportFields(fields => fields.map(field => ({ ...field, enabled: true })));
  };

  const deselectAllFields = () => {
    setExportFields(fields => fields.map(field => ({ ...field, enabled: false })));
  };

  const getExportData = () => {
    const enabledFields = exportFields.filter(field => field.enabled);
    
    return bookings.map(booking => {
      const row: Record<string, any> = {};
      
      enabledFields.forEach(field => {
        switch (field.key) {
          case 'property_name':
            row[field.label] = booking.property?.nome || 'N/A';
            break;
          case 'nights':
            const checkIn = new Date(booking.check_in);
            const checkOut = new Date(booking.check_out);
            row[field.label] = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
            break;
          case 'check_in_formatted':
            row[field.label] = format(new Date(booking.check_in), 'dd/MM/yyyy');
            break;
          case 'check_out_formatted':
            row[field.label] = format(new Date(booking.check_out), 'dd/MM/yyyy');
            break;
          case 'total_price':
            row[field.label] = booking.total_price ? `€${booking.total_price.toFixed(2)}` : 'N/A';
            break;
          case 'created_at':
            row[field.label] = booking.created_at ? format(new Date(booking.created_at), 'dd/MM/yyyy HH:mm') : 'N/A';
            break;
          default:
            row[field.label] = booking[field.key as keyof CalendarBooking] || 'N/A';
        }
      });
      
      return row;
    });
  };

  const exportToCSV = () => {
    const data = getExportData();
    if (data.length === 0) {
      toast({
        title: "Nessun dato da esportare",
        description: "Non ci sono prenotazioni nel periodo selezionato.",
        variant: "destructive",
      });
      return;
    }

    const headers = exportFields.filter(field => field.enabled).map(field => field.label);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `prenotazioni_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async () => {
    // This would require a PDF library like jsPDF
    // For now, we'll show a placeholder implementation
    toast({
      title: "Funzionalità in sviluppo",
      description: "L'esportazione PDF sarà disponibile presto.",
      variant: "default",
    });
  };

  const exportToExcel = async () => {
    // This would require a library like xlsx
    // For now, we'll show a placeholder implementation
    toast({
      title: "Funzionalità in sviluppo",
      description: "L'esportazione Excel sarà disponibile presto.",
      variant: "default",
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      switch (exportFormat) {
        case 'csv':
          exportToCSV();
          break;
        case 'pdf':
          await exportToPDF();
          break;
        case 'excel':
          await exportToExcel();
          break;
      }
      
      if (exportFormat === 'csv') {
        toast({
          title: "Esportazione completata",
          description: "Il file è stato scaricato con successo.",
        });
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Errore durante l'esportazione",
        description: "Si è verificato un errore. Riprova.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'csv':
        return <FileText className="w-4 h-4" />;
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'excel':
        return <FileSpreadsheet className="w-4 h-4" />;
    }
  };

  const enabledFieldsCount = exportFields.filter(field => field.enabled).length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Esporta
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Esporta Prenotazioni
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Prenotazioni:</span>
                  <Badge variant="secondary" className="ml-2">
                    {bookings.length}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Campi selezionati:</span>
                  <Badge variant="secondary" className="ml-2">
                    {enabledFieldsCount}
                  </Badge>
                </div>
                {dateRange.from && (
                  <div className="col-span-2">
                    <span className="font-medium">Periodo:</span>
                    <span className="ml-2">
                      {format(dateRange.from, 'dd MMM yyyy', { locale: it })}
                      {dateRange.to && ` - ${format(dateRange.to, 'dd MMM yyyy', { locale: it })}`}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Export Format */}
          <div className="space-y-3">
            <Label>Formato di Esportazione</Label>
            <Select value={exportFormat} onValueChange={(value: ExportFormat) => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    CSV (Comma Separated Values)
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    PDF (Portable Document Format)
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel (XLSX)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Field Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Campi da Esportare</Label>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllFields}
                  className="text-xs"
                >
                  Seleziona Tutti
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deselectAllFields}
                  className="text-xs"
                >
                  Deseleziona Tutti
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-md p-3">
              {exportFields.map((field) => (
                <div key={field.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.key}
                    checked={field.enabled}
                    onCheckedChange={() => toggleField(field.key)}
                  />
                  <Label
                    htmlFor={field.key}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {field.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Warnings */}
          {bookings.length === 0 && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-800">
                Nessuna prenotazione trovata nel periodo selezionato.
              </span>
            </div>
          )}

          {enabledFieldsCount === 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-800">
                Seleziona almeno un campo da esportare.
              </span>
            </div>
          )}

          {exportFormat !== 'csv' && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Questo formato è in fase di sviluppo. Usa CSV per ora.
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Annulla
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || bookings.length === 0 || enabledFieldsCount === 0}
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Esportando...
              </>
            ) : (
              <>
                {getFormatIcon(exportFormat)}
                <span className="ml-2">Esporta {exportFormat.toUpperCase()}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}