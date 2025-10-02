import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { parseAndEnrichICS } from '@/lib/ics-parse'

type Range = { start: Date; end: Date }
type EventItem = any
type PropertyItem = { id: string; nome?: string; name?: string }

export interface CalendarBooking {
  id: string;
  property_id: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  check_in: string;
  check_out: string;
  guests_count?: number;
  adults_count?: number;
  children_count?: number;
  total_price?: number;
  special_requests?: string;
  booking_status?: string;
  channel?: string;
  booking_reference?: string;
  external_booking_id?: string;
  created_at?: string;
  updated_at?: string;
  last_sync_at?: string;
  property?: { nome: string };
  isBlock?: boolean;
  source?: string;
  sourceIcon?: string;
  reason?: string;
  ota_name?: string;
}

export function useCalendarData(
  userIdOrParams?: string | null | {
    userId?: string | null
    selectedPropertyId?: string | null
    range?: Range
  }
) {
  const isOldSignature = typeof userIdOrParams === 'string' || userIdOrParams === null || userIdOrParams === undefined
  
  const userId = isOldSignature ? userIdOrParams as string | null : (userIdOrParams as any)?.userId
  const selectedPropertyId = isOldSignature ? null : (userIdOrParams as any)?.selectedPropertyId
  
  const stableRange = useMemo(() => {
    if (isOldSignature) {
      return { start: new Date(), end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) }
    }
    return (userIdOrParams as any)?.range || { start: new Date(), end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) }
  }, [isOldSignature, (userIdOrParams as any)?.range?.start?.getTime(), (userIdOrParams as any)?.range?.end?.getTime()])

  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<PropertyItem[]>([])
  const [effectivePropertyId, setEffectivePropertyId] = useState<string | null>(selectedPropertyId ?? null)
  const [events, setEvents] = useState<EventItem[]>([])

  useEffect(() => {
    if (selectedPropertyId !== undefined) {
      setEffectivePropertyId(selectedPropertyId)
    }
  }, [selectedPropertyId])

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!userId) {
        console.log('⏳ useCalendarData: skipping fetch, no userId')
        setLoading(false)
        return
      }

      setLoading(true)
      console.log('🔄 useCalendarData: fetching data for userId:', userId, 'selectedPropertyId:', effectivePropertyId)

      try {
        // 1. Fetch properties
        const { data: propertiesData, error: propertiesError } = await supabase
          .from('properties')
          .select('id, nome')
          .eq('host_id', userId)

        if (propertiesError) {
          console.error('❌ Error fetching properties:', propertiesError)
          setLoading(false)
          return
        }

        if (cancelled) return

        const fetchedProperties = propertiesData || []
        setProperties(fetchedProperties)

        // 2. Auto-select first property if none selected
        let targetPropertyId = effectivePropertyId
        if (!targetPropertyId && fetchedProperties.length > 0) {
          targetPropertyId = fetchedProperties[0].id
          setEffectivePropertyId(targetPropertyId)
        }

        // 3. Determine which properties to query
        const propertyIds = targetPropertyId ? [targetPropertyId] : fetchedProperties.map(p => p.id);
        
        if (propertyIds.length > 0) {
          // Fetch regular bookings
          const { data: bookingsData, error: bookingsError } = await supabase
            .from('bookings')
            .select('*')
            .in('property_id', propertyIds)
            .gte('check_in', stableRange.start.toISOString().split('T')[0])
            .lte('check_out', stableRange.end.toISOString().split('T')[0]);

          // Fetch calendar blocks
          const { data: calendarBlocksData, error: calendarBlocksError } = await supabase
            .from('calendar_blocks')
            .select('*')
            .in('property_id', propertyIds)
            .gte('start_date', stableRange.start.toISOString().split('T')[0])
            .lte('end_date', stableRange.end.toISOString().split('T')[0]);

          if (bookingsError) {
            console.error('❌ Error fetching bookings:', bookingsError);
          }
          
          if (calendarBlocksError) {
            console.error('❌ Error fetching calendar blocks:', calendarBlocksError);
          }

          if (!cancelled) {
            // Combine bookings and blocks
            const allBookings: CalendarBooking[] = (bookingsData || []).map(booking => ({
              ...booking,
              isBlock: false,
              booking_status: booking.booking_status || 'confirmed'
            }));

            const calendarBlocks: CalendarBooking[] = (calendarBlocksData || []).map(block => ({
              id: block.id,
              property_id: block.property_id,
              check_in: block.start_date,
              check_out: block.end_date,
              guest_name: block.reason || 'Blocked',
              booking_status: block.source?.startsWith('ical_') ? 'imported' : 'blocked',
              source: block.source || 'manual',
              reason: block.reason,
              isBlock: true,
              sourceIcon: block.source?.startsWith('ical_') ? 
                (block.source.includes('airbnb') ? '🏠' : 
                 block.source.includes('booking') ? '🔵' : 
                 block.source.includes('vrbo') ? '🏖️' : 
                 block.source.includes('agoda') ? '🌏' :
                 block.source.includes('tripadvisor') ? '🦉' : '📅') : '🚫',
              external_booking_id: block.external_id || block.id
            }));

            const allEvents = [...allBookings, ...calendarBlocks];

            // iCal data is now managed server-side via calendar_blocks table
            // All iCal events are imported by ics-sync edge function and stored in calendar_blocks
            // This eliminates CORS issues and improves performance
            console.log('📅 useCalendarData: iCal events loaded from calendar_blocks table');

            console.log('📅 useCalendarData: loaded events:', {
              bookings: bookingsData?.length || 0,
              blocks: calendarBlocksData?.length || 0,
              ical: allEvents.length - (bookingsData?.length || 0) - (calendarBlocksData?.length || 0),
              total: allEvents.length
            })
            setEvents(allEvents)
          }
        }

      } catch (error) {
        console.error('❌ useCalendarData error:', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    run()
    return () => { cancelled = true }
  }, [userId, effectivePropertyId, stableRange])

  const bookings = useMemo(() => events.filter(e => !e.isBlock), [events])
  const blocks = useMemo(() => events.filter(e => e.isBlock), [events])

  const rangeStart = stableRange.start
  const rangeEnd = stableRange.end

  const isLoading = loading
  const error = null

  const refetch = () => {
    setLoading(true)
  }

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const checkIn = new Date(booking.check_in)
      const checkOut = new Date(booking.check_out)
      return date >= checkIn && date <= checkOut
    })
  }

  const getBlocksForDate = (date: Date) => {
    return blocks.filter(block => {
      const startDate = new Date(block.check_in)
      const endDate = new Date(block.check_out)
      return date >= startDate && date <= endDate
    })
  }

  const getStatusForDate = (date: Date) => {
    const dateBookings = getBookingsForDate(date)
    const dateBlocks = getBlocksForDate(date)
    
    if (dateBookings.length > 0) return 'booked'
    if (dateBlocks.length > 0) return 'blocked'
    return 'available'
  }

  const getStyleForDate = (date: Date) => {
    const status = getStatusForDate(date)
    const dateBlocks = getBlocksForDate(date)
    
    switch (status) {
      case 'booked':
        return { backgroundColor: '#ef4444', color: 'white' }
      case 'blocked':
        const hasImportedBlock = dateBlocks.some(block => block.source?.startsWith('ical_'))
        if (hasImportedBlock) {
          return { backgroundColor: '#8b5cf6', color: 'white' }
        }
        return { backgroundColor: '#f59e0b', color: 'white' }
      default:
        return {}
    }
  }

  return {
    properties,
    bookings,
    blocks,
    isLoading,
    error,
    refetch,
    rangeStart,
    rangeEnd,
    getBookingsForDate,
    getBlocksForDate,
    getStatusForDate,
    getStyleForDate,
    selectedPropertyId: effectivePropertyId,
    setSelectedPropertyId: setEffectivePropertyId
  }
}
