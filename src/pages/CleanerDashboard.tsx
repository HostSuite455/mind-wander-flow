import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Calendar, 
  CheckSquare, 
  MessageSquare, 
  DollarSign, 
  User,
  TrendingUp,
  Clock
} from 'lucide-react';
import ChatSystem from '@/components/cleaning/ChatSystem';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function CleanerDashboard() {
  const [cleaner, setCleaner] = useState<any>(null);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    earnings: 0,
    upcomingTasks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCleanerData();
  }, []);

  const loadCleanerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non autenticato');

      // Get cleaner profile
      const { data: cleanerData, error: cleanerError } = await supabase
        .from('cleaners')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (cleanerError) throw cleanerError;
      setCleaner(cleanerData);

      // Get today's tasks
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: tasksData, error: tasksError } = await supabase
        .from('cleaning_tasks')
        .select(`
          *,
          properties (
            nome,
            address,
            city
          )
        `)
        .eq('assigned_cleaner_id', cleanerData.id)
        .gte('scheduled_start', `${today}T00:00:00`)
        .lte('scheduled_start', `${today}T23:59:59`)
        .order('scheduled_start');

      if (tasksError) throw tasksError;
      setTodayTasks(tasksData || []);

      // Get stats
      const { count: completedCount } = await supabase
        .from('cleaning_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_cleaner_id', cleanerData.id)
        .eq('status', 'done');

      const { count: upcomingCount } = await supabase
        .from('cleaning_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_cleaner_id', cleanerData.id)
        .eq('status', 'todo')
        .gte('scheduled_start', new Date().toISOString());

      // Get earnings (from task_accounting or payment logs)
      const { data: earningsData } = await supabase
        .from('task_accounting')
        .select('cleaner_earnings_cents')
        .eq('task_id', cleanerData.id);

      const totalEarnings = earningsData?.reduce(
        (sum, item) => sum + (item.cleaner_earnings_cents || 0),
        0
      ) || 0;

      setStats({
        tasksCompleted: completedCount || 0,
        earnings: totalEarnings / 100,
        upcomingTasks: upcomingCount || 0
      });
    } catch (error: any) {
      console.error('Error loading cleaner data:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ciao, {cleaner?.name}!</h1>
          <p className="text-muted-foreground">Ecco la tua giornata</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completati</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tasksCompleted}</div>
            <p className="text-xs text-muted-foreground">Totale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guadagni</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.earnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Totale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prossimi Task</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingTasks}</div>
            <p className="text-xs text-muted-foreground">In programma</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">Oggi</TabsTrigger>
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
          <TabsTrigger value="messages">Messaggi</TabsTrigger>
          <TabsTrigger value="payments">Pagamenti</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Focus di Oggi</CardTitle>
            </CardHeader>
            <CardContent>
              {todayTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nessun task per oggi</p>
                  <p className="text-sm">Goditi la giornata! 🎉</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayTasks.map((task) => (
                    <Card key={task.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">
                                {task.properties?.nome}
                              </h4>
                              <Badge variant={
                                task.status === 'done' ? 'default' :
                                task.status === 'in_progress' ? 'secondary' : 'outline'
                              }>
                                {task.status === 'done' ? 'Completato' :
                                 task.status === 'in_progress' ? 'In corso' : 'Da fare'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {task.properties?.address}, {task.properties?.city}
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4" />
                              <span>
                                {format(new Date(task.scheduled_start), 'HH:mm', { locale: it })}
                                {task.scheduled_end && ` - ${format(new Date(task.scheduled_end), 'HH:mm', { locale: it })}`}
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={() => window.location.href = '/cleaner-tasks'}
                            size="sm"
                          >
                            Apri
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Calendario Turni</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Vista calendario in arrivo...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          {cleaner && (
            <ChatSystem userType="cleaner" userId={cleaner.user_id} />
          )}
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Storico Pagamenti</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Nessun pagamento registrato
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
