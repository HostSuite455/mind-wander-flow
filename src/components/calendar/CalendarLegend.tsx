import React from 'react';

export const CalendarLegend: React.FC = () => {
  const legendItems = [
    { label: 'Confermata', color: 'bg-blue-500', textColor: 'text-blue-700' },
    { label: 'In Attesa', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
    { label: 'Cancellata', color: 'bg-red-500', textColor: 'text-red-700' },
    { label: 'Manutenzione', color: 'bg-gray-400 bg-stripes', textColor: 'text-gray-700' },
    { label: 'Uso Personale', color: 'bg-purple-400', textColor: 'text-purple-700' },
    { label: 'Non Disponibile', color: 'bg-red-400', textColor: 'text-red-700' }
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Legenda</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded ${item.color}`} />
            <span className={`text-xs font-medium ${item.textColor}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};