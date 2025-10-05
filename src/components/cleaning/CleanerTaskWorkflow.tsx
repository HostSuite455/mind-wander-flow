import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Play, StopCircle, Clock, Camera, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { differenceInMinutes } from 'date-fns';
import { PropertyChecklistView } from './PropertyChecklistView';
import { RoomPhotoUpload } from './RoomPhotoUpload';

interface TaskWorkflowProps {
  task: {
    id: string;
    status: string;
    started_at: string | null;
    property_id: string;
    duration_min: number;
  };
  onTaskUpdate: () => void;
}

export function CleanerTaskWorkflow({ task, onTaskUpdate }: TaskWorkflowProps) {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [issuesNotes, setIssuesNotes] = useState('');
  const [photosUploaded, setPhotosUploaded] = useState<any[]>([]);
  const [requiredRooms, setRequiredRooms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Timer effect
  useEffect(() => {
    if (task.status === 'in_progress' && task.started_at) {
      const updateTimer = () => {
        const elapsed = differenceInMinutes(new Date(), new Date(task.started_at!));
        setElapsedMinutes(elapsed);
      };
      
      updateTimer(); // Initial update
      const interval = setInterval(updateTimer, 10000); // Update every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [task.status, task.started_at]);
  
  // Load required rooms for photos
  useEffect(() => {
    loadPhotoRequirements();
  }, [task.property_id]);
  
  async function loadPhotoRequirements() {
    const { data } = await supabase
      .from('property_photo_requirements')
      .select('room_name')
      .eq('property_id', task.property_id)
      .eq('is_required', true)
      .order('display_order');
    
    const rooms = data?.map(r => r.room_name) || ['Camera', 'Bagno', 'Cucina'];
    setRequiredRooms(rooms);
  }
  
  async function handleStart() {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('cleaning_tasks')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', task.id);
      
      if (error) throw error;
      
      // Send notification to host
      await supabase.functions.invoke('notify-host-task-update', {
        body: {
          task_id: task.id,
          event: 'task_started'
        }
      });
      
      toast.success('Pulizia avviata! Timer attivato.');
      onTaskUpdate();
    } catch (error: any) {
      console.error('Start error:', error);
      toast.error('Errore nell\'avvio del task');
    } finally {
      setLoading(false);
    }
  }
  
  async function handleComplete() {
    // Validate: all photos uploaded?
    const missingRooms = requiredRooms.filter(
      room => !photosUploaded.find(p => p.room === room)
    );
    
    if (missingRooms.length > 0) {
      toast.error(`Foto mancanti per: ${missingRooms.join(', ')}`);
      return;
    }
    
    // Validate: timer >= 60 min
    if (elapsedMinutes < 60) {
      toast.error(`Devi lavorare almeno 60 minuti. Tempo attuale: ${elapsedMinutes} min`);
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('cleaning_tasks')
        .update({
          status: 'done',
          completed_at: new Date().toISOString(),
          actual_duration_min: elapsedMinutes,
          photos_json: photosUploaded,
          issues_notes: issuesNotes || null
        })
        .eq('id', task.id);
      
      if (error) throw error;
      
      // Send notification to host
      await supabase.functions.invoke('notify-host-task-update', {
        body: {
          task_id: task.id,
          event: 'task_completed',
          duration_min: elapsedMinutes,
          has_issues: !!issuesNotes
        }
      });
      
      toast.success('Pulizia completata con successo!');
      onTaskUpdate();
    } catch (error: any) {
      console.error('Complete error:', error);
      if (error.message?.includes('check_min_duration')) {
        toast.error('Tempo minimo non rispettato (60 min)');
      } else {
        toast.error('Errore nel completamento del task');
      }
    } finally {
      setLoading(false);
    }
  }
  
  const canComplete = elapsedMinutes >= 60 && photosUploaded.length >= requiredRooms.length;
  
  if (task.status === 'todo') {
    return (
      <Button onClick={handleStart} className="w-full" disabled={loading}>
        {loading ? (
          <>Avvio in corso...</>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Inizia Pulizia
          </>
        )}
      </Button>
    );
  }
  
  if (task.status === 'in_progress') {
    return (
      <div className="space-y-6">
        {/* Timer */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
              <span className="text-sm text-muted-foreground">Tempo trascorso</span>
            </div>
            <div className="text-3xl font-mono font-bold text-blue-600">
              {Math.floor(elapsedMinutes / 60)}h {elapsedMinutes % 60}m
            </div>
          </div>
          {elapsedMinutes < 60 && (
            <p className="text-xs text-muted-foreground mt-2">
              Tempo minimo: 60 minuti (rimangono {60 - elapsedMinutes} min)
            </p>
          )}
        </Card>
        
        {/* Checklist */}
        <PropertyChecklistView propertyId={task.property_id} taskId={task.id} />
        
        {/* Photo Upload per stanza */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Foto completamento ({photosUploaded.length}/{requiredRooms.length})
          </h3>
          <RoomPhotoUpload
            rooms={requiredRooms}
            onPhotosChange={setPhotosUploaded}
          />
        </Card>
        
        {/* Note problemi */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            Problemi o danni rilevati (opzionale)
          </h3>
          <Textarea
            value={issuesNotes}
            onChange={(e) => setIssuesNotes(e.target.value)}
            placeholder="Descrivi eventuali danni, problemi o anomalie riscontrate durante la pulizia..."
            rows={4}
          />
        </Card>
        
        {/* Termina button */}
        <Button
          onClick={handleComplete}
          disabled={!canComplete || loading}
          className="w-full"
          variant={canComplete ? 'default' : 'secondary'}
        >
          {loading ? (
            <>Completamento in corso...</>
          ) : canComplete ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Termina Pulizia
            </>
          ) : (
            <>
              <StopCircle className="mr-2 h-4 w-4" />
              {elapsedMinutes < 60 
                ? `Termina (mancano ${Math.max(0, 60 - elapsedMinutes)} min)`
                : `Termina (foto mancanti: ${requiredRooms.length - photosUploaded.length})`
              }
            </>
          )}
        </Button>
      </div>
    );
  }
  
  // status === 'done' or 'blocked'
  return null;
}
