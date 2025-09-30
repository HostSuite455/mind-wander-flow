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

            // Try to load iCal data if available
            try {
              console.log('🔍 useCalendarData: searching for iCal URLs for properties:', propertyIds)
              
              // Get ical_configs for these properties
              const { data: icalConfigsData } = await supabase
                .from('ical_configs')
                .select('id, property_id')
                .in('property_id', propertyIds)
                .eq('is_active', true);

              const configIds = (icalConfigsData || []).map(c => c.id);
              
              if (configIds.length > 0) {
                const { data: icalUrls, error: icalError } = await supabase
                  .from('ical_urls')
                  .select('id, url, source, ota_name, is_active, ical_config_id')
                  .in('ical_config_id', configIds)
                  .eq('is_active', true);

                console.log('📡 useCalendarData: iCal query result:', { icalUrls, icalError })

                if (icalError) {
                  console.warn('⚠️ Error querying iCal URLs:', icalError)
                }

                if (icalUrls && icalUrls.length > 0) {
                  console.log('📡 useCalendarData: found iCal URLs:', icalUrls.length)
                  
                  for (const icalUrl of icalUrls) {
                    try {
                      console.log('🌐 Fetching iCal from:', icalUrl.url)
                      const response = await fetch(icalUrl.url, { mode: 'cors' })
                      if (response.ok) {
                        const icalText = await response.text()
                        const icalEvents = parseAndEnrichICS(icalText)
                        
                        // Get property_id for this ical_url
                        const config = icalConfigsData?.find(c => c.id === icalUrl.ical_config_id);
                        const propertyIdForUrl = config?.property_id;

                        // Convert iCal events to calendar blocks format
                        const icalBlocks = icalEvents
                          .filter(event => {
                            const eventStart = new Date(event.start || '')
                            const eventEnd = new Date(event.end || '')
                            return eventStart >= stableRange.start && eventEnd <= stableRange.end
                          })
                          .map(event => ({
                            id: `ical-${event.uid}`,
                            property_id: propertyIdForUrl,
                            check_in: event.start?.split('T')[0] || '',
                            check_out: event.end?.split('T')[0] || '',
                            guest_name: event.guestName || event.summary || 'iCal Block',
                            booking_status: 'imported',
                            reason: event.summary || 'iCal Block',
                            source: `ical_${icalUrl.source || icalUrl.ota_name}`,
                            ota_name: icalUrl.ota_name,
                            channel: event.channel || icalUrl.ota_name,
                            isBlock: true,
                            sourceIcon: '📅'
                          }))
                        
                        allEvents.push(...icalBlocks)
                        console.log(`📅 useCalendarData: loaded ${icalBlocks.length} iCal events from ${icalUrl.source || icalUrl.ota_name}`)
                      } else {
                        console.warn(`⚠️ Failed to fetch iCal from ${icalUrl.url}: ${response.status}`)
                      }
                    } catch (icalError) {
                      console.warn(`⚠️ Failed to load iCal from ${icalUrl.url}:`, icalError)
                    }
                  }
                } else {
                  console.log('📡 useCalendarData: no iCal URLs found for properties:', propertyIds)
                }
              }
            } catch (icalError) {
              console.warn('⚠️ Error loading iCal data:', icalError)
            }

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
