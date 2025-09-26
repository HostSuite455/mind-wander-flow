// src/pages/calendar-pro.tsx
// Complete integration with your existing Supabase setup

import React from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import CustomCalendar from '@/components/calendar/CustomCalendar';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useCalendarData } from '@/hooks/useCalendarData';
import { Loader2 } from 'lucide-react';

const CalendarProPage: React.FC = () => {
  const { user } = useAuthUser();
  const { 
    properties, 
    bookings, 
    blocks, 
    isLoading, 
    error, 
    refetch 
  } = useCalendarData(user?.id);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Caricamento calendario...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-medium mb-2">Errore nel caricamento</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Riprova
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
          <div className="text-sm text-gray-500">
            {properties.length} proprietà • {bookings.length} prenotazioni
          </div>
        </div>
        
        <CustomCalendar
          properties={properties}
          bookings={bookings}
          blocks={blocks}
          onRefresh={refetch}
        />
      </div>
    </DashboardLayout>
  );
};

export default CalendarProPage;

// ---

// src/hooks/useCalendarData.ts
// Custom hook for fetching and managing calendar data

import { useState, useEffect, useCallback } from 'react';
import { supaSelect } from '@/lib/supaSafe';
import { useToast } from '@/hooks/use-toast';

interface Property {
  id: string;
  name: string;
  address?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface Booking {
  id: string;
  property_id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  total_price?: number;
  created_at: string;
  updated_at: string;
}

interface CalendarBlock {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  block_type: 'maintenance' | 'personal' | 'unavailable';
  reason?: string;
  created_at: string;
  updated_at: string;
}

export const useCalendarData = (userId: string | undefined) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch properties
      const propertiesData = await supaSelect('properties', '*', 'user_id', userId);
      if (propertiesData) {
        setProperties(propertiesData);
      }

      // Fetch bookings for the next 12 months
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(startDate.getFullYear() + 1);

      // Get property IDs for filtering
      const propertyIds = propertiesData?.map(p => p.id) || [];
      
      if (propertyIds.length > 0) {
        // Fetch bookings
        const bookingsData = await supaSelect(
          'bookings',
          '*',
          `property_id.in.(${propertyIds.join(',')})`,
          undefined,
          undefined,
          undefined,
          undefined,
          `check_in.gte.${startDate.toISOString().split('T')[0]},check_out.lte.${endDate.toISOString().split('T')[0]}`
        );
        
        if (bookingsData) {
          setBookings(bookingsData);
        }

        // Fetch calendar blocks
        const blocksData = await supaSelect(
          'calendar_blocks',
          '*',
          `property_id.in.(${propertyIds.join(',')})`,
          undefined,
          undefined,
          undefined,
          undefined,
          `start_date.gte.${startDate.toISOString().split('T')[0]},end_date.lte.${endDate.toISOString().split('T')[0]}`
        );
        
        if (blocksData) {
          setBlocks(blocksData);
        }
      }
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      setError(errorMessage);
      toast({
        title: "Errore",
        description: "Impossibile caricare i dati del calendario",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    properties,
    bookings,
    blocks,
    isLoading,
    error,
    refetch
  };
};

// ---

// src/hooks/useCalendarOperations.ts
// Hook for calendar CRUD operations

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export const useCalendarOperations = () => {
  const { toast } = useToast();

  const createBooking = useCallback(async (booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([booking])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Prenotazione creata",
        description: `Prenotazione per ${booking.guest_name} creata con successo`,
      });

      return data;
    } catch (err) {
      console.error('Error creating booking:', err);
      toast({
        title: "Errore",
        description: "Impossibile creare la prenotazione",
        variant: "destructive"
      });
      throw err;
    }
  }, [toast]);

  const updateBooking = useCallback(async (id: string, updates: Partial<Booking>) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Prenotazione aggiornata",
        description: "Prenotazione aggiornata con successo",
      });

      return data;
    } catch (err) {
      console.error('Error updating booking:', err);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare la prenotazione",
        variant: "destructive"
      });
      throw err;
    }
  }, [toast]);

  const deleteBooking = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Prenotazione eliminata",
        description: "Prenotazione eliminata con successo",
      });
    } catch (err) {
      console.error('Error deleting booking:', err);
      toast({
        title: "Errore",
        description: "Impossibile eliminare la prenotazione",
        variant: "destructive"
      });
      throw err;
    }
  }, [toast]);

  const createBlock = useCallback(async (block: Omit<CalendarBlock, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('calendar_blocks')
        .insert([block])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Blocco creato",
        description: `Blocco ${block.block_type} creato con successo`,
      });

      return data;
    } catch (err) {
      console.error('Error creating block:', err);
      toast({
        title: "Errore",
        description: "Impossibile creare il blocco",
        variant: "destructive"
      });
      throw err;
    }
  }, [toast]);

  const updateBlock = useCallback(async (id: string, updates: Partial<CalendarBlock>) => {
    try {
      const { data, error } = await supabase
        .from('calendar_blocks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Blocco aggiornato",
        description: "Blocco aggiornato con successo",
      });

      return data;
    } catch (err) {
      console.error('Error updating block:', err);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il blocco",
        variant: "destructive"
      });
      throw err;
    }
  }, [toast]);

  const deleteBlock = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('calendar_blocks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Blocco eliminato",
        description: "Blocco eliminato con successo",
      });
    } catch (err) {
      console.error('Error deleting block:', err);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il blocco",
        variant: "destructive"
      });
      throw err;
    }
  }, [toast]);

  return {
    createBooking,
    updateBooking,
    deleteBooking,
    createBlock,
    updateBlock,
    deleteBlock
  };
};

// ---

// src/components/calendar/modals/BookingModal.tsx
// Modal for creating and editing bookings

import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Mail, Euro, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking?: Booking | null;
  selectedDate?: Date;
  selectedPropertyId?: string;
  properties: Property[];
  onSave: (booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<Booking>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  booking,
  selectedDate,
  selectedPropertyId,
  properties,
  onSave,
  onUpdate,
  onDelete
}) => {
  const [formData, setFormData] = useState({
    property_id: selectedPropertyId || '',
    guest_name: '',
    guest_email: '',
    check_in: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    check_out: '',
    status: 'confirmed' as const,
    total_price: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (booking) {
      setFormData({
        property_id: booking.property_id,
        guest_name: booking.guest_name,
        guest_email: booking.guest_email,
        check_in: booking.check_in,
        check_out: booking.check_out,
        status: booking.status,
        total_price: booking.total_price || 0
      });
    } else if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        check_in: format(selectedDate, 'yyyy-MM-dd'),
        property_id: selectedPropertyId || ''
      }));
    }
  }, [booking, selectedDate, selectedPropertyId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.property_id) newErrors.property_id = 'Seleziona una proprietà';
    if (!formData.guest_name.trim()) newErrors.guest_name = 'Nome ospite richiesto';
    if (!formData.guest_email.trim()) newErrors.guest_email = 'Email ospite richiesta';
    if (!formData.check_in) newErrors.check_in = 'Data check-in richiesta';
    if (!formData.check_out) newErrors.check_out = 'Data check-out richiesta';
    
    if (formData.check_in && formData.check_out) {
      if (new Date(formData.check_out) <= new Date(formData.check_in)) {
        newErrors.check_out = 'Check-out deve essere dopo check-in';
      }
    }

    if (formData.guest_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guest_email)) {
      newErrors.guest_email = 'Email non valida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (booking) {
        await onUpdate(booking.id, formData);
      } else {
        await onSave(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!booking || !onDelete) return;
    
    if (window.confirm('Sei sicuro di voler eliminare questa prenotazione?')) {
      setIsLoading(true);
      try {
        await onDelete(booking.id);
        onClose();
      } catch (error) {
        console.error('Error deleting booking:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {booking ? 'Modifica Prenotazione' : 'Nuova Prenotazione'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Property Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Proprietà
            </label>
            <select
              value={formData.property_id}
              onChange={(e) => setFormData(prev => ({ ...prev, property_id: e.target.value }))}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.property_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Seleziona proprietà</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
            {errors.property_id && (
              <p className="text-red-500 text-sm mt-1">{errors.property_id}</p>
            )}
          </div>

          {/* Guest Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Nome Ospite
              </label>
              <input
                type="text"
                value={formData.guest_name}
                onChange={(e) => setFormData(prev => ({ ...prev, guest_name: e.target.value }))}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.guest_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nome e cognome"
              />
              {errors.guest_name && (
                <p className="text-red-500 text-sm mt-1">{errors.guest_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-1" />
                Email Ospite
              </label>
              <input
                type="email"
                value={formData.guest_email}
                onChange={(e) => setFormData(prev => ({ ...prev, guest_email: e.target.value }))}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.guest_email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="ospite@email.com"
              />
              {errors.guest_email && (
                <p className="text-red-500 text-sm mt-1">{errors.guest_email}</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Check-in
              </label>
              <input
                type="date"
                value={formData.check_in}
                onChange={(e) => setFormData(prev => ({ ...prev, check_in: e.target.value }))}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.check_in ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.check_in && (
                <p className="text-red-500 text-sm mt-1">{errors.check_in}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Check-out
              </label>
              <input
                type="date"
                value={formData.check_out}
                onChange={(e) => setFormData(prev => ({ ...prev, check_out: e.target.value }))}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.check_out ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.check_out && (
                <p className="text-red-500 text-sm mt-1">{errors.check_out}</p>
              )}
            </div>
          </div>

          {/* Status and Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="confirmed">Confermata</option>
                <option value="pending">In attesa</option>
                <option value="cancelled">Cancellata</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Euro className="h-4 w-4 inline mr-1" />
                Prezzo Totale
              </label>
              <input
                type="number"
                value={formData.total_price}
                onChange={(e) => setFormData(prev => ({ ...prev, total_price: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              {booking && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  Elimina
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading && <Clock className="h-4 w-4 mr-2 animate-spin" />}
                {booking ? 'Aggiorna' : 'Crea'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};