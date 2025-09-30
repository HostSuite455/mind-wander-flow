import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DollarSign, Calendar, Download, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface TeamManagerProps {
  cleanerId: string;
}

export default function TeamManager({ cleanerId }: TeamManagerProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    thisMonth: 0,
    pending: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentData();
  }, [cleanerId]);

  const loadPaymentData = async () => {
    try {
      // Load payment history
      const { data: paymentData, error: paymentError } = await supabase
        .from('automatic_payment_logs')
        .select('*')
        .eq('cleaner_id', cleanerId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (paymentError) throw paymentError;

      setPayments(paymentData || []);

      // Calculate stats
      const total = paymentData?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0;
      const thisMonth = paymentData
        ?.filter(p => {
          const date = new Date(p.created_at);
          const now = new Date();
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        })
        .reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0;
      const pending = paymentData?.filter(p => p.status === 'pending').length || 0;

      // Get completed tasks count
      const { data: tasksData } = await supabase
        .from('cleaning_tasks')
        .select('id', { count: 'exact' })
        .eq('assigned_cleaner_id', cleanerId)
        .eq('status', 'done');

      setStats({
        totalEarnings: total / 100,
        thisMonth: thisMonth / 100,
        pending,
        completedTasks: tasksData?.length || 0,
      });
    } catch (error: any) {
      console.error('Error loading payment data:', error);
      toast.error('Errore nel caricamento dei dati pagamento');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guadagno Totale</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.totalEarnings.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questo Mese</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats.thisMonth.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completati</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Attesa</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Storico Pagamenti</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Esporta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nessun pagamento registrato
              </p>
            ) : (
              payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">
                        €{(payment.amount_cents / 100).toFixed(2)}
                      </p>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status === 'completed' && 'Completato'}
                        {payment.status === 'pending' && 'In Attesa'}
                        {payment.status === 'failed' && 'Fallito'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(payment.created_at), 'dd MMMM yyyy, HH:mm', {
                        locale: it,
                      })}
                    </p>
                    {payment.error_message && (
                      <p className="text-xs text-destructive mt-1">
                        {payment.error_message}
                      </p>
                    )}
                  </div>
                  
                  {payment.stripe_payment_intent_id && (
                    <Button variant="ghost" size="sm">
                      Dettagli
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
