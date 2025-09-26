import React, { useState, useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
}

interface KeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  onClose?: () => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ 
  shortcuts, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Show shortcuts modal with Ctrl+?
      if (event.ctrlKey && event.key === '?') {
        event.preventDefault();
        setIsVisible(true);
        return;
      }

      // Hide modal with Escape
      if (event.key === 'Escape' && isVisible) {
        setIsVisible(false);
        return;
      }

      // Execute shortcuts
      const shortcut = shortcuts.find(s => {
        const keys = s.key.toLowerCase().split('+');
        const hasCtrl = keys.includes('ctrl');
        const hasShift = keys.includes('shift');
        const hasAlt = keys.includes('alt');
        const mainKey = keys[keys.length - 1];

        return (
          (!hasCtrl || event.ctrlKey) &&
          (!hasShift || event.shiftKey) &&
          (!hasAlt || event.altKey) &&
          event.key.toLowerCase() === mainKey
        );
      });

      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors z-50"
        title="Mostra scorciatoie (Ctrl+?)"
      >
        <Keyboard className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Scorciatoie da Tastiera
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  {shortcut.description}
                </span>
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Premi <kbd className="px-1 py-0.5 text-xs bg-gray-100 border rounded">Ctrl+?</kbd> per mostrare/nascondere questo pannello
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Default shortcuts for calendar
export const defaultCalendarShortcuts: KeyboardShortcut[] = [
  {
    key: 'Ctrl+N',
    description: 'Nuova prenotazione',
    action: () => console.log('New booking')
  },
  {
    key: 'Ctrl+F',
    description: 'Cerca prenotazioni',
    action: () => console.log('Search bookings')
  },
  {
    key: 'Ctrl+E',
    description: 'Esporta calendario',
    action: () => console.log('Export calendar')
  },
  {
    key: 'Ctrl+R',
    description: 'Aggiorna dati',
    action: () => console.log('Refresh data')
  },
  {
    key: 'Ctrl+1',
    description: 'Vista singola proprietà',
    action: () => console.log('Single property view')
  },
  {
    key: 'Ctrl+2',
    description: 'Vista multi proprietà',
    action: () => console.log('Multi property view')
  },
  {
    key: 'ArrowLeft',
    description: 'Mese precedente',
    action: () => console.log('Previous month')
  },
  {
    key: 'ArrowRight',
    description: 'Mese successivo',
    action: () => console.log('Next month')
  },
  {
    key: 'T',
    description: 'Vai a oggi',
    action: () => console.log('Go to today')
  }
];