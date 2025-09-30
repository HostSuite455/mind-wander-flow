import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ChatSystem from '@/components/cleaning/ChatSystem';
import PropertyPicker from '@/components/cleaning/PropertyPicker';
import TeamManager from '@/components/cleaning/TeamManager';
import { useAuthUser } from '@/hooks/useAuthUser';
import { Calendar, CheckCircle2, Clock, DollarSign, Loader2, MapPin, ListChecks } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export default function CleanerDashboard() {
  const navigate = useNavigate();
  const { user, userId, loading: authLoading } = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [cleanerProfile, setCleanerProfile] = useState<any>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [stats, setStats] = useState({
    completedTasks: 0,
    earnings: 0,
    upcomingTasks: 0,
  });

  useEffect(() => {
    if (!authLoading && userId) {
      loadCleanerData();
    }
  }, [authLoading, userId]);

  useEffect(() => {
    if (cleanerProfile?.id && selectedPropertyId) {
      loadTasks();
    }
  }, [cleanerProfile, selectedPropertyId]);

  const loadCleanerData = async () => {
    try {
      if (!userId) {
        toast.error('Utente non autenticato');
        navigate('/cleaner-login');
        return;
      }

      // Get cleaner profile
      const { data: cleaner, error: cleanerError } = await supabase
        .from('cleaners')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (cleanerError) throw cleanerError;
      
      if (!cleaner) {
        toast.error('Profilo cleaner non trovato');
        navigate('/cleaner-login');
        return;
      }

      setCleanerProfile(cleaner);

      // Calculate stats
      const { data: completedData } = await supabase
        .from('cleaning_tasks')
        .select('id', { count: 'exact' })
        .eq('assigned_cleaner_id', cleaner.id)
        .eq('status', 'done');

      const { data: upcomingData } = await supabase
        .from('cleaning_tasks')
        .select('id', { count: 'exact' })
        .eq('assigned_cleaner_id', cleaner.id)
        .in('status', ['todo', 'in_progress'])
        .gte('scheduled_start', new Date().toISOString());

      // Get earnings from task_accounting
      const { data: earningsData } = await supabase
        .from('task_accounting')
        .select('cleaner_earnings_cents')
        .in('task_id', (completedData || []).map((t: any) => t.id));

      const totalEarnings = earningsData?.reduce(
        (sum, item) => sum + (item.cleaner_earnings_cents || 0),
        0
      ) || 0;

      setStats({
        completedTasks: completedData?.length || 0,
        earnings: totalEarnings / 100,
        upcomingTasks: upcomingData?.length || 0,
      });

    } catch (error: any) {
      console.error('Error loading cleaner data:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    if (!cleanerProfile?.id) return;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Get today's tasks
      const { data: todayData, error: todayError } = await supabase
        .from('cleaning_tasks')
        .select(`
          *,
          properties (
            nome,
            address,
            city
          )
        `)
        .eq('assigned_cleaner_id', cleanerProfile.id)
        .eq('property_id', selectedPropertyId)
        .gte('scheduled_start', `${today}T00:00:00`)
        .lte('scheduled_start', `${today}T23:59:59`)
        .order('scheduled_start', { ascending: true });

      if (todayError) throw todayError;
      setTodayTasks(todayData || []);

      // Get all upcoming tasks
      const { data: allData, error: allError } = await supabase
        .from('cleaning_tasks')
        .select(`
          *,
          properties (
            nome,
            address,
            city
          )
        `)
        .eq('assigned_cleaner_id', cleanerProfile.id)
        .eq('property_id', selectedPropertyId)
        .gte('scheduled_start', new Date().toISOString())
        .order('scheduled_start', { ascending: true });

      if (allError) throw allError;
      setAllTasks(allData || []);

    } catch (error: any) {
      console.error('Error loading tasks:', error);
      toast.error('Errore nel caricamento dei task');
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('cleaning_tasks')
        .update({
          status: 'done',
          actual_end: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Task completato!');
      loadTasks();
      loadCleanerData();
    } catch (error: any) {
      console.error('Error completing task:', error);
      toast.error('Errore nel completamento del task');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cleanerProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold mb-4">Profilo Non Trovato</h2>
          <p className="text-muted-foreground mb-4">
            Non hai ancora un profilo cleaner. Contatta il tuo host per ricevere un invito.
          </p>
          <Button onClick={() => navigate('/cleaner-login')}>
            Torna al Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 to-indigo-100/50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Property Picker */}
        <PropertyPicker
          cleanerId={cleanerProfile.id}
          selectedPropertyId={selectedPropertyId}
          onPropertySelect={setSelectedPropertyId}
        />

        {!selectedPropertyId ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              Seleziona una proprietà per vedere i tuoi task
            </p>
          </Card>
        ) : (
          <>
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-blue-900">Ciao, {cleanerProfile.name}!</h1>
              <p className="text-blue-700">Ecco il tuo pannello di lavoro</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Task Completati</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completedTasks}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Guadagni Totali</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">€{stats.earnings.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Prossimi Task</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.upcomingTasks}</div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="oggi" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="oggi">Oggi</TabsTrigger>
                <TabsTrigger value="calendario">Calendario</TabsTrigger>
                <TabsTrigger value="messaggi">Messaggi</TabsTrigger>
                <TabsTrigger value="pagamenti">Pagamenti</TabsTrigger>
              </TabsList>

              <TabsContent value="oggi" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Focus di Oggi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {todayTasks.length === 0 ? (
                        <div className="text-center py-12">
                          <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
                          <p className="text-lg font-semibold mb-2">Ottimo lavoro!</p>
                          <p className="text-muted-foreground">
                            Nessun task programmato per oggi
                          </p>
                        </div>
                      ) : (
                        todayTasks.map((task) => (
                          <div
                            key={task.id}
                            className="p-4 border rounded-lg hover:shadow-md transition-all"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-lg">{task.properties?.nome}</h4>
                                  <Badge variant={task.status === 'done' ? 'default' : 'secondary'}>
                                    {task.status === 'done' ? '✓ Completato' : 'Da fare'}
                                  </Badge>
                                </div>
                                
                                {task.properties?.address && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {task.properties.address}, {task.properties.city}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {format(new Date(task.scheduled_start), 'HH:mm', { locale: it })} -
                                {format(new Date(task.scheduled_end), 'HH:mm', { locale: it })}
                              </span>
                              <span>⏱️ {task.duration_min} min</span>
                              <span className="flex items-center gap-1">
                                <ListChecks className="h-4 w-4" />
                                Checklist
                              </span>
                            </div>

                            {task.notes && (
                              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                                <p className="font-medium text-blue-900 mb-1">Note Host:</p>
                                <p className="text-blue-800">{task.notes}</p>
                              </div>
                            )}

                            {task.status !== 'done' && (
                              <Button
                                onClick={() => handleTaskComplete(task.id)}
                                className="w-full"
                                size="lg"
                              >
                                <CheckCircle2 className="mr-2 h-5 w-5" />
                                Segna come Completato
                              </Button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="calendario">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Prossimi Turni
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {allTasks.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Nessun turno programmato
                        </p>
                      ) : (
                        allTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{task.properties?.nome}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(task.scheduled_start), 'EEEE dd MMMM, HH:mm', {
                                  locale: it,
                                })}
                              </p>
                            </div>
                            <Badge variant={task.status === 'done' ? 'default' : 'outline'}>
                              {task.status === 'done' ? 'Completato' : task.type}
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="messaggi">
                {userId && (
                  <ChatSystem
                    userType="cleaner"
                    userId={userId}
                  />
                )}
              </TabsContent>

              <TabsContent value="pagamenti">
                <TeamManager cleanerId={cleanerProfile.id} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
