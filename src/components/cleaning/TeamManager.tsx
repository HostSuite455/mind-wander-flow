import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Trash2, UserPlus, Users } from 'lucide-react';

interface TeamManagerProps {
  propertyId: string;
}

export default function TeamManager({ propertyId }: TeamManagerProps) {
  const [cleaners, setCleaners] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCleaner, setNewCleaner] = useState({ name: '', phone: '', email: '' });

  useEffect(() => {
    if (propertyId) {
      loadTeamData();
    }
  }, [propertyId]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      
      // Load cleaners owned by current user
      const { data: cleanersData } = await supabase
        .from('cleaners')
        .select('*')
        .order('name');
      
      // Load assignments for this property
      const { data: assignmentsData } = await supabase
        .from('cleaner_assignments')
        .select(`
          *,
          cleaners(id, name)
        `)
        .eq('property_id', propertyId);
      
      // Load rates
      const { data: ratesData } = await supabase
        .from('cleaner_rates')
        .select('*')
        .or(`property_id.eq.${propertyId},property_id.is.null`);
      
      setCleaners(cleanersData || []);
      setAssignments(assignmentsData || []);
      setRates(ratesData || []);
    } catch (error) {
      toast.error('Errore nel caricamento del team');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createCleaner = async () => {
    if (!newCleaner.name.trim()) {
      toast.error('Nome obbligatorio');
      return;
    }

    try {
      const { error } = await supabase
        .from('cleaners')
        .insert({
          name: newCleaner.name,
          phone: newCleaner.phone || null,
          email: newCleaner.email || null,
          owner_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      setNewCleaner({ name: '', phone: '', email: '' });
      loadTeamData();
      toast.success('Addetto creato con successo');
    } catch (error) {
      toast.error('Errore nella creazione dell\'addetto');
      console.error(error);
    }
  };

  const assignCleaner = async (cleanerId: string) => {
    try {
      const { error } = await supabase
        .from('cleaner_assignments')
        .insert({
          property_id: propertyId,
          cleaner_id: cleanerId,
          weight: 1,
          active: true
        });

      if (error) throw error;

      loadTeamData();
      toast.success('Addetto assegnato alla proprietà');
    } catch (error) {
      toast.error('Errore nell\'assegnazione');
      console.error(error);
    }
  };

  const removeAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('cleaner_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      loadTeamData();
      toast.success('Assegnazione rimossa');
    } catch (error) {
      toast.error('Errore nella rimozione');
      console.error(error);
    }
  };

  const setRate = async (cleanerId: string, rateType: 'per_task' | 'per_hour', amountCents: number) => {
    try {
      const { error } = await supabase
        .from('cleaner_rates')
        .upsert({
          cleaner_id: cleanerId,
          property_id: propertyId,
          rate_type: rateType,
          amount_cents: amountCents
        }, {
          onConflict: 'cleaner_id,property_id'
        });

      if (error) throw error;

      loadTeamData();
      toast.success('Tariffa aggiornata');
    } catch (error) {
      toast.error('Errore nell\'aggiornamento della tariffa');
      console.error(error);
    }
  };

  const autoAssignWeek = async () => {
    try {
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      const to = new Date(from);
      to.setDate(to.getDate() + 7);

      const { data, error } = await supabase.functions.invoke('auto-assign-week', {
        body: {
          property_id: propertyId,
          from: from.toISOString(),
          to: to.toISOString()
        }
      });

      if (error) throw error;

      toast.success(`Assegnati ${data?.assigned || 0} task automaticamente`);
    } catch (error) {
      toast.error('Errore nell\'auto-assegnazione');
      console.error(error);
    }
  };

  if (loading) {
    return <div className="p-4">Caricamento team...</div>;
  }

  const assignedCleanerIds = assignments.map(a => a.cleaner_id);
  const unassignedCleaners = cleaners.filter(c => !assignedCleanerIds.includes(c.id));

  return (
    <div className="space-y-6">
      {/* Create new cleaner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Nuovo Addetto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={newCleaner.name}
                onChange={(e) => setNewCleaner(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                value={newCleaner.phone}
                onChange={(e) => setNewCleaner(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+39 123 456 7890"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newCleaner.email}
                onChange={(e) => setNewCleaner(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
          </div>
          <Button onClick={createCleaner}>Crea Addetto</Button>
        </CardContent>
      </Card>

      {/* Assigned cleaners */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Assegnato ({assignments.length})
          </CardTitle>
          <Button onClick={autoAssignWeek} variant="outline">
            Auto-assegna Settimana
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {assignments.map((assignment) => {
              const rate = rates.find(r => 
                r.cleaner_id === assignment.cleaner_id && 
                (r.property_id === propertyId || r.property_id === null)
              );
              
              return (
                <div key={assignment.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">{assignment.cleaners?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Peso: {assignment.weight} • 
                      Tariffa: €{rate ? (rate.amount_cents / 100).toFixed(2) : '30.00'} {rate?.rate_type === 'per_hour' ? 'per ora' : 'per task'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select 
                      className="border border-border rounded px-2 py-1 bg-background text-sm"
                      defaultValue={rate?.rate_type || 'per_task'}
                      onChange={(e) => {
                        const rateType = e.target.value as 'per_task' | 'per_hour';
                        const amount = rate?.amount_cents || 3000;
                        setRate(assignment.cleaner_id, rateType, amount);
                      }}
                    >
                      <option value="per_task">Per Task</option>
                      <option value="per_hour">Per Ora</option>
                    </select>
                    <Input
                      type="number"
                      placeholder="30.00"
                      className="w-24"
                      defaultValue={rate ? (rate.amount_cents / 100).toFixed(2) : '30.00'}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value);
                        if (value > 0) {
                          const rateType = rate?.rate_type || 'per_task';
                          setRate(assignment.cleaner_id, rateType, Math.round(value * 100));
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeAssignment(assignment.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            
            {assignments.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                Nessun addetto assegnato a questa proprietà
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available cleaners to assign */}
      {unassignedCleaners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Addetti Disponibili</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unassignedCleaners.map((cleaner) => (
                <div key={cleaner.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{cleaner.name}</div>
                    {cleaner.phone && (
                      <div className="text-sm text-muted-foreground">{cleaner.phone}</div>
                    )}
                  </div>
                  <Button size="sm" onClick={() => assignCleaner(cleaner.id)}>
                    Assegna
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}