import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

type Range = { start: Date; end: Date }
type EventItem = any // tipizza se hai i tipi
type PropertyItem = { id: string; name?: string }

export function useCalendarData(params: {
  userId?: string | null
  selectedPropertyId?: string | null
  range: Range
}) {
  const { userId, selectedPropertyId, range } = params
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<PropertyItem[]>([])
  const [effectivePropertyId, setEffectivePropertyId] = useState<string | null>(selectedPropertyId ?? null)
  const [events, setEvents] = useState<EventItem[]>([])

  // Forza l'aggiornamento quando cambia lo user o la prop selezionata
  useEffect(() => {
    if (selectedPropertyId !== undefined) {
      setEffectivePropertyId(selectedPropertyId)
    }
  }, [selectedPropertyId])

  useEffect(() => {
    let cancelled = false
    async function run() {
      // Aspetta che arrivi userId
      if (!userId) {
        // non fetchiamo ancora, ma NON settiamo loading=false per evitare flicker
        return
      }
      setLoading(true)

      // 1) Properties dell'host
      const { data: props, error: propsErr } = await supabase
        .from('properties')
        .select('id,name')
        .eq('owner_id', userId)
        .order('created_at', { ascending: true })

      if (propsErr) {
        console.error('fetch properties error', propsErr)
        if (!cancelled) setLoading(false)
        return
      }

      let nextSelected = effectivePropertyId
      if (!nextSelected && props && props.length > 0) {
        nextSelected = props[0].id // auto-select prima proprietà
      }

      // 2) Eventi (solo se c'è una property)
      let evs: EventItem[] = []
      if (nextSelected) {
        const { data, error } = await supabase
          .from('reservations')
          .select('*')
          .eq('property_id', nextSelected)
          .gte('start', range.start.toISOString())
          .lt('end', range.end.toISOString())
        if (error) {
          console.error('fetch reservations error', error)
        } else {
          evs = data ?? []
        }
      }

      if (!cancelled) {
        setProperties(props ?? [])
        setEffectivePropertyId(nextSelected ?? null)
        setEvents(evs)
        setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
    // NOTE: deps includono userId e range; quando userId arriva, rifà il fetch
  }, [userId, range.start.getTime(), range.end.getTime()])

  return {
    loading,
    properties,
    selectedPropertyId: effectivePropertyId,
    events,
    hasProperties: properties.length > 0,
  }
}

// Legacy exports for backward compatibility
export interface CalendarBooking {
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

export interface CalendarBlock {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  block_type: 'maintenance' | 'personal' | 'unavailable';
  reason?: string;
  created_at: string;
  updated_at: string;
}

export function getBookingsForDate(
  bookings: CalendarBooking[], 
  date: Date
): CalendarBooking[] {
  const dateStr = date.toISOString().split('T')[0];
  return bookings.filter(booking => {
    const checkIn = new Date(booking.check_in).toISOString().split('T')[0];
    const checkOut = new Date(booking.check_out).toISOString().split('T')[0];
    return dateStr >= checkIn && dateStr < checkOut;
  });
}

export function getBlocksForDate(
  blocks: CalendarBlock[], 
  date: Date
): CalendarBlock[] {
  const dateStr = date.toISOString().split('T')[0];
  return blocks.filter(block => {
    const startDate = new Date(block.start_date).toISOString().split('T')[0];
    const endDate = new Date(block.end_date).toISOString().split('T')[0];
    return dateStr >= startDate && dateStr <= endDate;
  });
}

export function getBookingStatusColor(status?: string | null): string {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getBlockTypeColor(reason?: string | null): string {
  switch (reason) {
    case 'maintenance':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'personal':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'unavailable':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-purple-100 text-purple-800 border-purple-200';
  }
}