import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

type Range = { start: Date; end: Date }
type EventItem = any // tipizza se hai i tipi
type PropertyItem = { id: string; name?: string }

// Supporta sia la vecchia firma (userId) che la nuova (oggetto con parametri)
export function useCalendarData(
  userIdOrParams?: string | null | {
    userId?: string | null
    selectedPropertyId?: string | null
    range?: Range
  }
) {
  // Determina se è la vecchia o nuova firma
  const isOldSignature = typeof userIdOrParams === 'string' || userIdOrParams === null || userIdOrParams === undefined
  
  // Estrai i parametri in base alla firma
  const userId = isOldSignature ? userIdOrParams as string | null : (userIdOrParams as any)?.userId
  const selectedPropertyId = isOldSignature ? null : (userIdOrParams as any)?.selectedPropertyId
  const range = isOldSignature ? 
    { start: new Date(), end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } : // 30 giorni di default
    (userIdOrParams as any)?.range || { start: new Date(), end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }

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
        console.log('⏳ useCalendarData: skipping fetch, no userId')
        setLoading(false)
        return
      }

      setLoading(true)
      console.log('🔄 useCalendarData: fetching data for userId:', userId)

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

        // 3. Fetch bookings if we have a property
        if (targetPropertyId) {
          const { data: bookingsData, error: bookingsError } = await supabase
            .from('bookings')
            .select('*')
            .eq('property_id', targetPropertyId)
            .gte('check_in', range.start.toISOString())
            .lte('check_out', range.end.toISOString())

          if (bookingsError) {
            console.error('❌ Error fetching bookings:', bookingsError)
            setLoading(false)
          } else if (!cancelled) {
            setEvents(bookingsData || [])
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
  }, [userId, effectivePropertyId, range.start.getTime(), range.end.getTime()])

  const bookings = useMemo(() => events.filter(e => e.type !== 'block'), [events])
  const blocks = useMemo(() => events.filter(e => e.type === 'block'), [events])

  const rangeStart = range.start
  const rangeEnd = range.end

  const isLoading = loading
  const error = null // Simplified for now

  const refetch = () => {
    // Trigger re-fetch by updating a dependency
    setLoading(true)
  }

  // Utility functions for backward compatibility
  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const checkIn = new Date(booking.check_in)
      const checkOut = new Date(booking.check_out)
      return date >= checkIn && date <= checkOut
    })
  }

  const getBlocksForDate = (date: Date) => {
    return blocks.filter(block => {
      const startDate = new Date(block.start_date)
      const endDate = new Date(block.end_date)
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
    switch (status) {
      case 'booked':
        return { backgroundColor: '#ef4444', color: 'white' }
      case 'blocked':
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