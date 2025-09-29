import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import PropertyPicker from '@/components/cleaning/PropertyPicker'
import TeamManager from '@/components/cleaning/TeamManager'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

export default function PuliziePage(){
  const [properties, setProperties] = useState<any[]>([])
  const [propId, setPropId] = useState<string|null>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [ical, setIcal] = useState<any[]>([])
  const [syncing, setSyncing] = useState(false)
  
  const [from, to] = useMemo(()=>{
    const s = new Date(); s.setHours(0,0,0,0)
    const e = new Date(s); e.setDate(e.getDate()+7)
    return [s, e]
  },[])

  useEffect(()=>{ (async()=>{
    const { data } = await supabase.from('properties').select('id,nome').order('created_at')
    setProperties(data??[]); 
    if (!propId && data?.[0]) setPropId(data[0].id)
  })() },[])

  useEffect(()=>{ if(!propId) return; (async()=>{
    const { data } = await supabase
      .from('cleaning_tasks')
      .select(`
        *, 
        reservations(guest_name,start_date,end_date), 
        properties(nome),
        cleaners(name)
      `)
      .eq('property_id', propId)
      .gte('scheduled_start', from.toISOString())
      .lt('scheduled_start', to.toISOString())
      .order('scheduled_start')
    setTasks(data??[])
  })() },[propId, from, to])

  useEffect(()=>{ if(!propId) return; (async()=>{
    const { data } = await supabase
      .from('ical_sources')
      .select('*')
      .eq('property_id', propId)
      .order('created_at')
    setIcal(data??[])
  })() },[propId])

  async function addIcal(channel: string, url: string){
    if(!propId) return
    
    try {
      const { error } = await supabase
        .from('ical_sources')
        .insert({ 
          property_id: propId, 
          channel, 
          url, 
          active: true 
        })
      
      if (error) throw error
      
      const { data } = await supabase
        .from('ical_sources')
        .select('*')
        .eq('property_id', propId)
      setIcal(data??[])
      toast.success('Sorgente iCal aggiunta con successo')
    } catch (error) {
      toast.error('Errore nell\'aggiunta della sorgente iCal')
      console.error(error)
    }
  }

  async function syncNow(){
    if(!propId) return
    setSyncing(true)
    
    try {
      const response = await supabase.functions.invoke('ical-sync-fetch', {
        body: { property_id: propId }
      })
      
      if (response.error) throw response.error
      
      // Refetch tasks after sync
      const { data } = await supabase
        .from('cleaning_tasks')
        .select(`
          *, 
          reservations(guest_name,start_date,end_date), 
          properties(nome),
          cleaners(name)
        `)
        .eq('property_id', propId)
        .gte('scheduled_start', from.toISOString())
        .lt('scheduled_start', to.toISOString())
        .order('scheduled_start')
      setTasks(data??[])
      
      toast.success('Sincronizzazione completata')
    } catch (error) {
      toast.error('Errore durante la sincronizzazione')
      console.error(error)
    } finally {
      setSyncing(false)
    }
  }

  async function updateStatus(id:string, status:'todo'|'in_progress'|'done'|'blocked'){
    try {
      const { error } = await supabase
        .from('cleaning_tasks')
        .update({ status })
        .eq('id', id)
      
      if (error) throw error
      
      setTasks(t=>t.map(x=>x.id===id?{...x,status}:x))
      toast.success('Stato aggiornato')
    } catch (error) {
      toast.error('Errore nell\'aggiornamento dello stato')
      console.error(error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      'todo': 'outline',
      'in_progress': 'secondary', 
      'done': 'default',
      'blocked': 'destructive'
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestione Pulizie</h1>
      </div>
      
      <div className="flex gap-4 items-center">
        <PropertyPicker properties={properties} value={propId} onChange={setPropId}/>
        <div className="text-sm text-muted-foreground">
          Finestra: {from.toLocaleDateString()} → {to.toLocaleDateString()}
        </div>
      </div>

      {propId && (
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tasks">Task</TabsTrigger>
            <TabsTrigger value="ical">iCal Sources</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Task di Pulizia (prossimi 7 giorni)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.map(t=>(
                    <div key={t.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {new Date(t.scheduled_start).toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t.properties?.nome ?? t.property_id} • {t.type}
                          </div>
                          {t.reservations?.guest_name && (
                            <div className="text-sm">
                              Ospite: {t.reservations.guest_name}
                            </div>
                          )}
                          {t.cleaners?.name && (
                            <div className="text-sm">
                              Assegnato a: {t.cleaners.name}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          {getStatusBadge(t.status)}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={()=>updateStatus(t.id,'in_progress')}
                          disabled={t.status === 'done'}
                        >
                          Avvia
                        </Button>
                        <Button 
                          size="sm"
                          onClick={()=>updateStatus(t.id,'done')}
                          disabled={t.status === 'done'}
                        >
                          Completa
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!tasks.length && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nessun task programmato
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ical" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Sorgenti iCal</CardTitle>
                <Button 
                  onClick={syncNow} 
                  disabled={syncing}
                  variant="outline"
                >
                  {syncing ? 'Sincronizzando...' : 'Sincronizza ora'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {ical.map((s:any)=>(
                    <div key={s.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{s.channel}</Badge>
                        <Badge variant={s.active ? 'default' : 'destructive'}>
                          {s.active ? 'Attivo' : 'Inattivo'}
                        </Badge>
                      </div>
                      <div className="text-sm break-all">{s.url}</div>
                      {s.last_sync_at && (
                        <div className="text-xs text-muted-foreground">
                          Ultimo sync: {new Date(s.last_sync_at).toLocaleString()}
                        </div>
                      )}
                      {s.last_error && (
                        <div className="text-xs text-destructive">
                          Errore: {s.last_error}
                        </div>
                      )}
                    </div>
                  ))}
                  {!ical.length && (
                    <div className="text-center py-4 text-muted-foreground">
                      Nessuna sorgente configurata
                    </div>
                  )}
                </div>
                
                <form 
                  className="flex gap-2" 
                  onSubmit={async (e:any)=>{
                    e.preventDefault(); 
                    const f=new FormData(e.currentTarget); 
                    await addIcal(String(f.get('channel')), String(f.get('url'))); 
                    e.currentTarget.reset();
                  }}
                >
                  <select 
                    name="channel" 
                    className="border border-border rounded px-3 py-2 bg-background"
                    required
                  >
                    <option value="airbnb">Airbnb</option>
                    <option value="booking">Booking.com</option>
                    <option value="vrbo">Vrbo</option>
                    <option value="other">Altro</option>
                  </select>
                  <input 
                    name="url" 
                    className="border border-border rounded px-3 py-2 bg-background flex-1" 
                    placeholder="https://...ics" 
                    required 
                  />
                  <Button type="submit">Aggiungi</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <TeamManager propertyId={propId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}