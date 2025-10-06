import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import PhotoUpload from '@/components/cleaning/PhotoUpload'
import { CleanerTaskWorkflow } from '@/components/cleaning/CleanerTaskWorkflow'

export default function CleanerTasksPage(){
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showPhotoUpload, setShowPhotoUpload] = useState<string | null>(null)

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    try {
      // RLS limita ai task con assigned_cleaner_id collegato all'utente
      const { data, error } = await supabase
        .from('cleaning_tasks')
        .select(`
          id, 
          scheduled_start, 
          scheduled_end, 
          status, 
          type,
          duration_min,
          started_at,
          completed_at,
          actual_duration_min,
          photos_json,
          issues_notes,
          notes,
          completion_photo_url,
          property_id,
          properties(nome, id), 
          reservations(guest_count, guest_name, check_in, check_out)
        `)
        .order('scheduled_start')
      
      if (error) throw error
      
      setTasks(data ?? [])
    } catch (error) {
      toast.error('Errore nel caricamento dei task')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function setStatus(id: string, status: 'in_progress' | 'done') {
    // If trying to mark as done, require photo first
    if (status === 'done') {
      const task = tasks.find(t => t.id === id)
      if (!task?.completion_photo_url) {
        setShowPhotoUpload(id)
        return
      }
    }

    try {
      const { error } = await supabase
        .from('cleaning_tasks')
        .update({ status })
        .eq('id', id)
      
      if (error) throw error
      
      setTasks(t => t.map(x => x.id === id ? { ...x, status } : x))
      toast.success('Stato aggiornato con successo')
    } catch (error) {
      toast.error('Errore nell\'aggiornamento dello stato')
      console.error(error)
    }
  }

  const handlePhotoUploaded = async (taskId: string, photoUrl: string) => {
    // Update the task with the photo URL
    try {
      const { error } = await supabase
        .from('cleaning_tasks')
        .update({ completion_photo_url: photoUrl })
        .eq('id', taskId)
      
      if (error) throw error
      
      setTasks(t => t.map(x => x.id === taskId ? { ...x, completion_photo_url: photoUrl } : x))
      setShowPhotoUpload(null)
      
      // Now mark as done
      await setStatus(taskId, 'done')
    } catch (error) {
      toast.error('Errore nell\'aggiornamento della foto')
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
    const labels: Record<string, string> = {
      'todo': 'Da fare',
      'in_progress': 'In corso',
      'done': 'Completato',
      'blocked': 'Bloccato'
    }
    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    )
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'turnover': 'Cambio ospiti',
      'midstay': 'Pulizia intermedia',
      'inspection': 'Ispezione'
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Caricamento task...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">I miei task di pulizia</h1>
        <Button variant="outline" onClick={loadTasks}>
          Aggiorna
        </Button>
      </div>

      <div className="space-y-4">
        {tasks.map(t => (
          <Card key={t.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">
                      {t.properties?.nome ?? 'Proprietà non specificata'}
                    </h3>
                    {getStatusBadge(t.status)}
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>
                      <strong>Tipo:</strong> {getTypeLabel(t.type)}
                    </div>
                    <div>
                      <strong>Orario:</strong> {new Date(t.scheduled_start).toLocaleString()} 
                      {t.scheduled_end && ` - ${new Date(t.scheduled_end).toLocaleTimeString()}`}
                    </div>
                    {t.duration_min && (
                      <div>
                        <strong>Durata stimata:</strong> {t.duration_min} minuti
                      </div>
                    )}
                    {t.reservations?.guest_name && (
                      <div>
                        <strong>Ospite:</strong> {t.reservations.guest_name}
                        {t.reservations.guest_count && ` (${t.reservations.guest_count} persone)`}
                      </div>
                    )}
                    {t.reservations?.check_in && t.reservations?.check_out && (
                      <div>
                        <strong>Soggiorno:</strong> {new Date(t.reservations.check_in).toLocaleDateString()} - {new Date(t.reservations.check_out).toLocaleDateString()}
                      </div>
                    )}
                    {t.notes && (
                      <div>
                        <strong>Note:</strong> {t.notes}
                      </div>
                    )}
                    {t.completion_photo_url && (
                      <div>
                        <strong>Foto completamento:</strong> 
                        <img 
                          src={t.completion_photo_url} 
                          alt="Foto completamento task" 
                          className="mt-1 w-20 h-20 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <CleanerTaskWorkflow 
                task={{
                  id: t.id,
                  status: t.status,
                  started_at: t.started_at,
                  property_id: t.property_id,
                  duration_min: t.duration_min
                }}
                onTaskUpdate={loadTasks}
              />
            </CardContent>
          </Card>
        ))}
        
        {!tasks.length && (
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-medium mb-2">Nessun task assegnato</h3>
              <p className="text-muted-foreground">
                Al momento non hai task di pulizia assegnati.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Photo Upload Modal */}
      {showPhotoUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Foto obbligatoria per completare il task</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Per completare questo task è necessario caricare una foto di prova del lavoro svolto.
            </p>
            <PhotoUpload
              onPhotoUploaded={(photoUrl) => handlePhotoUploaded(showPhotoUpload, photoUrl)}
              label="Foto completamento task"
            />
            <Button
              variant="outline"
              onClick={() => setShowPhotoUpload(null)}
              className="mt-4 w-full"
            >
              Annulla
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}