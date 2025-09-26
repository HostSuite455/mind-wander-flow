import React, { useState } from 'react';
import { Download, FileText, Calendar, Printer } from 'lucide-react';
import { format } from 'date-fns';

interface ExportCalendarProps {
  bookings: Array<{
    id: string;
    guest_name: string;
    property_id: string;
    check_in: string;
    check_out: string;
    status: string;
    total_price?: number;
  }>;
  properties: Array<{ id: string; name: string }>;
  currentDate: Date;
}

export const ExportCalendar: React.FC<ExportCalendarProps> = ({
  bookings,
  properties,
  currentDate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'ical' | 'print'>('csv');

  const exportToCSV = () => {
    const headers = [
      'Data Check-in',
      'Data Check-out',
      'Nome Ospite',
      'Proprietà',
      'Status',
      'Prezzo'
    ];

    const csvData = bookings.map(booking => {
      const property = properties.find(p => p.id === booking.property_id);
      return [
        booking.check_in,
        booking.check_out,
        booking.guest_name,
        property?.name || '',
        booking.status,
        booking.total_price?.toString() || '0'
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `calendario-${format(currentDate, 'yyyy-MM')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToICAL = () => {
    const icalHeader = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Your Company//Calendar Pro//EN'
    ];

    const icalEvents = bookings.map(booking => {
      const property = properties.find(p => p.id === booking.property_id);
      return [
        'BEGIN:VEVENT',
        `UID:${booking.id}@yourcompany.com`,
        `DTSTART:${booking.check_in.replace(/-/g, '')}`,
        `DTEND:${booking.check_out.replace(/-/g, '')}`,
        `SUMMARY:${booking.guest_name} - ${property?.name || ''}`,
        `DESCRIPTION:Status: ${booking.status}${booking.total_price ? ` - €${booking.total_price}` : ''}`,
        'END:VEVENT'
      ].join('\n');
    });

    const icalFooter = 'END:VCALENDAR';
    const icalContent = [...icalHeader, ...icalEvents, icalFooter].join('\n');

    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `calendario-${format(currentDate, 'yyyy-MM')}.ics`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    switch (exportFormat) {
      case 'csv':
        exportToCSV();
        break;
      case 'ical':
        exportToICAL();
        break;
      case 'print':
        window.print();
        break;
      case 'pdf':
        // This would typically use a library like jsPDF
        console.log('PDF export not implemented yet');
        break;
    }
    setIsOpen(false);
  };

  const exportOptions = [
    { value: 'csv', label: 'Excel/CSV', icon: FileText, description: 'Esporta come file CSV' },
    { value: 'ical', label: 'Calendar (iCal)', icon: Calendar, description: 'Esporta come file iCal' },
    { value: 'print', label: 'Stampa', icon: Printer, description: 'Stampa calendario' },
    { value: 'pdf', label: 'PDF', icon: FileText, description: 'Esporta come PDF (presto)' }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
      >
        <Download className="h-4 w-4" />
        <span>Esporta</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          <h3 className="font-medium text-gray-900 mb-3">Esporta Calendario</h3>
          
          <div className="space-y-2 mb-4">
            {exportOptions.map(option => (
              <label key={option.value} className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="exportFormat"
                  value={option.value}
                  checked={exportFormat === option.value}
                  onChange={(e) => setExportFormat(e.target.value as any)}
                  className="mt-1 mr-3 text-blue-600"
                />
                <div className="flex-1">
                  <div className="flex items-center">
                    <option.icon className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-medium text-gray-900">{option.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-gray-200">
            <button
              onClick={() => setIsOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Annulla
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              disabled={exportFormat === 'pdf'}
            >
              Esporta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};