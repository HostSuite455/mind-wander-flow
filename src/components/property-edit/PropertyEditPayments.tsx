import { useState, useEffect } from "react";
import { Property } from "@/lib/properties";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, Plus, Building2, DollarSign, Calendar, Zap, Check, AlertCircle } from "lucide-react";

interface Props {
  property: Property;
}

interface PaymentMethod {
  id: string;
  type: string;
  details: any;
  is_default: boolean;
  is_active: boolean;
}

interface PaymentSchedule {
  id: string;
  cleaner_id: string;
  cleaner_name?: string;
  payment_method_id: string;
  frequency: string;
  auto_pay: boolean;
}

interface PaymentDetails {
  iban?: string;
  bank_name?: string;
  account_holder?: string;
  email?: string;
  [key: string]: any;
}

const PAYMENT_METHOD_ICONS = {
  bank_transfer: Building2,
  paypal: DollarSign,
  revolut: CreditCard,
  cash: DollarSign,
  stripe: CreditCard,
};

export function PropertyEditPayments({ property }: Props) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [cleaners, setCleaners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMethodDialog, setShowAddMethodDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [newMethod, setNewMethod] = useState<{
    type: string;
    details: PaymentDetails;
  }>({
    type: "bank_transfer",
    details: { iban: "", bank_name: "", account_holder: "" },
  });
  const [newSchedule, setNewSchedule] = useState({
    cleaner_id: "",
    payment_method_id: "",
    frequency: "monthly",
    auto_pay: false,
  });

  useEffect(() => {
    loadPaymentData();
  }, [property.id]);

  async function loadPaymentData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Carica payment methods
      const { data: methodsData, error: methodsError } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("host_id", user.id);

      if (methodsError) throw methodsError;

      // Carica cleaners assegnati a questa property
      const { data: assignedCleaners, error: cleanersError } = await supabase
        .from("cleaner_assignments")
        .select(`
          cleaner_id,
          cleaners!inner (id, name, email)
        `)
        .eq("property_id", property.id)
        .eq("active", true);

      if (cleanersError) throw cleanersError;

      const cleanersFlattened = assignedCleaners?.map((a: any) => a.cleaners).filter(Boolean) || [];

      // Carica schedules per i cleaners di questa property
      const cleanerIds = assignedCleaners.map((a: any) => a.cleaner_id);
      if (cleanerIds.length > 0) {
        const { data: schedulesData, error: schedulesError } = await supabase
          .from("cleaner_payment_schedules")
          .select("*")
          .in("cleaner_id", cleanerIds);

        if (schedulesError) throw schedulesError;

        // Arricchisci con nomi cleaners
        const enrichedSchedules = schedulesData?.map((schedule) => {
          const cleaner = cleanersFlattened.find(
            (c: any) => c.id === schedule.cleaner_id
          );
          return {
            ...schedule,
            cleaner_name: cleaner?.name || "Unknown",
          };
        });

        setSchedules(enrichedSchedules || []);
      }

      setPaymentMethods(methodsData || []);
      setCleaners(cleanersFlattened);
    } catch (error) {
      console.error("Error loading payment data:", error);
      toast.error("Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
  }

  async function addPaymentMethod() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("payment_methods").insert({
        host_id: user.id,
        type: newMethod.type,
        details: newMethod.details,
        is_default: paymentMethods.length === 0,
        is_active: true,
      });

      if (error) throw error;

      toast.success("Metodo di pagamento aggiunto! 💳");
      setShowAddMethodDialog(false);
      setNewMethod({
        type: "bank_transfer",
        details: { iban: "", bank_name: "", account_holder: "" },
      });
      loadPaymentData();
    } catch (error) {
      console.error("Error adding payment method:", error);
      toast.error("Errore nell'aggiunta del metodo");
    }
  }

  async function createSchedule() {
    if (!newSchedule.cleaner_id || !newSchedule.payment_method_id) {
      toast.error("Seleziona addetto e metodo di pagamento");
      return;
    }

    try {
      const { error } = await supabase.from("cleaner_payment_schedules").insert({
        cleaner_id: newSchedule.cleaner_id,
        payment_method_id: newSchedule.payment_method_id,
        frequency: newSchedule.frequency,
        auto_pay: newSchedule.auto_pay,
      });

      if (error) throw error;

      toast.success("Piano pagamenti configurato! ⚡");
      setShowScheduleDialog(false);
      setNewSchedule({
        cleaner_id: "",
        payment_method_id: "",
        frequency: "monthly",
        auto_pay: false,
      });
      loadPaymentData();
    } catch (error) {
      console.error("Error creating schedule:", error);
      toast.error("Errore nella configurazione");
    }
  }

  const getMethodLabel = (type: string) => {
    const labels: Record<string, string> = {
      bank_transfer: "Bonifico Bancario",
      paypal: "PayPal",
      revolut: "Revolut",
      cash: "Contanti",
      stripe: "Stripe",
    };
    return labels[type] || type;
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      weekly: "Settimanale",
      monthly: "Mensile",
      per_task: "Per Task",
    };
    return labels[frequency] || frequency;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Metodi di Pagamento</CardTitle>
              <CardDescription>Configura come pagare gli addetti</CardDescription>
            </div>
            <Dialog open={showAddMethodDialog} onOpenChange={setShowAddMethodDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi Metodo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuovo Metodo di Pagamento</DialogTitle>
                  <DialogDescription>
                    Configura un metodo per pagare gli addetti
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Tipo di Pagamento</Label>
                    <Select
                      value={newMethod.type}
                      onValueChange={(value) =>
                        setNewMethod({
                          ...newMethod,
                          type: value,
                          details:
                            value === "bank_transfer"
                              ? { iban: "", bank_name: "", account_holder: "" }
                              : value === "paypal"
                              ? { email: "" }
                              : {},
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">🏦 Bonifico Bancario</SelectItem>
                        <SelectItem value="paypal">💳 PayPal</SelectItem>
                        <SelectItem value="revolut">🚀 Revolut</SelectItem>
                        <SelectItem value="cash">💵 Contanti</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newMethod.type === "bank_transfer" && (
                    <>
                      <div className="space-y-2">
                        <Label>IBAN</Label>
                        <Input
                          placeholder="IT60X0542811101000000123456"
                          value={newMethod.details.iban || ""}
                          onChange={(e) =>
                            setNewMethod({
                              ...newMethod,
                              details: { ...newMethod.details, iban: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nome Banca</Label>
                        <Input
                          placeholder="Banca Intesa"
                          value={newMethod.details.bank_name || ""}
                          onChange={(e) =>
                            setNewMethod({
                              ...newMethod,
                              details: { ...newMethod.details, bank_name: e.target.value },
                            })
                          }
                        />
                      </div>
                    </>
                  )}

                  {newMethod.type === "paypal" && (
                    <div className="space-y-2">
                      <Label>Email PayPal</Label>
                      <Input
                        type="email"
                        placeholder="payments@example.com"
                        value={newMethod.details.email || ""}
                        onChange={(e) =>
                          setNewMethod({
                            ...newMethod,
                            details: { email: e.target.value },
                          })
                        }
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddMethodDialog(false)}>
                    Annulla
                  </Button>
                  <Button onClick={addPaymentMethod}>Aggiungi</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
              <h3 className="text-lg font-medium mb-2">Nessun metodo configurato</h3>
              <p className="text-muted-foreground mb-6">
                Aggiungi un metodo per iniziare a pagare gli addetti
              </p>
              <Button onClick={() => setShowAddMethodDialog(true)} variant="outline">
                Configura Primo Metodo
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {paymentMethods.map((method) => {
                const Icon = PAYMENT_METHOD_ICONS[method.type as keyof typeof PAYMENT_METHOD_ICONS] || CreditCard;
                return (
                  <Card key={method.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{getMethodLabel(method.type)}</h4>
                            {method.is_default && <Badge>Predefinito</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {method.type === "bank_transfer" && method.details.iban}
                            {method.type === "paypal" && method.details.email}
                          </p>
                        </div>
                        {method.is_active && (
                          <Check className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Schedules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Piani di Pagamento</CardTitle>
              <CardDescription>Configura quando e come pagare ogni addetto</CardDescription>
            </div>
            {paymentMethods.length > 0 && cleaners.length > 0 && (
              <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuovo Piano
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Configura Piano Pagamenti</DialogTitle>
                    <DialogDescription>
                      Imposta frequenza e metodo per un addetto
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Addetto</Label>
                      <Select
                        value={newSchedule.cleaner_id}
                        onValueChange={(value) =>
                          setNewSchedule({ ...newSchedule, cleaner_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona addetto" />
                        </SelectTrigger>
                        <SelectContent>
                          {cleaners.map((cleaner) => (
                            <SelectItem key={cleaner.id} value={cleaner.id}>
                              {cleaner.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Metodo di Pagamento</Label>
                      <Select
                        value={newSchedule.payment_method_id}
                        onValueChange={(value) =>
                          setNewSchedule({ ...newSchedule, payment_method_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona metodo" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.id} value={method.id}>
                              {getMethodLabel(method.type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Frequenza</Label>
                      <Select
                        value={newSchedule.frequency}
                        onValueChange={(value) =>
                          setNewSchedule({ ...newSchedule, frequency: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">📅 Settimanale</SelectItem>
                          <SelectItem value="monthly">📅 Mensile</SelectItem>
                          <SelectItem value="per_task">⚡ Per Task</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        <div>
                          <Label>Pagamento Automatico</Label>
                          <p className="text-xs text-muted-foreground">
                            Paga automaticamente alla scadenza
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={newSchedule.auto_pay}
                        onCheckedChange={(checked) =>
                          setNewSchedule({ ...newSchedule, auto_pay: checked })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                      Annulla
                    </Button>
                    <Button onClick={createSchedule}>Crea Piano</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
              <h3 className="text-lg font-medium mb-2">Nessun piano configurato</h3>
              <p className="text-muted-foreground mb-6">
                Configura quando e come pagare i tuoi addetti
              </p>
              {paymentMethods.length === 0 && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4" />
                  <span>Aggiungi prima un metodo di pagamento</span>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-3">
              {schedules.map((schedule) => (
                <Card key={schedule.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{schedule.cleaner_name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{getFrequencyLabel(schedule.frequency)}</Badge>
                          {schedule.auto_pay && (
                            <Badge className="bg-green-500">
                              <Zap className="w-3 h-3 mr-1" />
                              Auto
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Modifica
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
