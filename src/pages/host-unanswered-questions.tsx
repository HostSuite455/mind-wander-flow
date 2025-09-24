import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HelpCircle, MessageSquare, Clock, CheckCircle, User, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useActiveProperty } from "@/hooks/useActiveProperty";

type UnansweredQuestion = {
  id: string;
  question: string;
  guest_code: string;
  property_id: string;
  status: string;
  created_at: string;
};

type Property = {
  id: string;
  nome: string;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800">In Attesa</Badge>;
    case "resolved":
      return <Badge className="bg-green-100 text-green-800">Risolto</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const HostUnansweredQuestions = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [questions, setQuestions] = useState<UnansweredQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Global active property state
  const { id: propertyId, setId: setPropertyId } = useActiveProperty();

  // Load host's properties
  const loadProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, nome')
        .order('nome');
      
      if (error) throw error;
      setProperties(data || []);
    } catch (e: any) {
      console.error('Error loading properties:', e);
      if (localStorage.getItem('debug') === '1') {
        toast.error(`RLS error loading properties: ${e.message}`);
      }
    }
  };

  // Load questions with property filter
  const loadQuestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const base = supabase
        .from('unanswered_questions')
        .select('id, question, property_id, guest_code, status, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      const query = propertyId === 'all'
        ? base
        : base.eq('property_id', propertyId);

      const { data, error } = await query;
      if (error) throw error;
      setQuestions(data || []);
    } catch (e: any) {
      const errorMsg = e.message || 'Errore nel caricamento domande';
      setError(errorMsg);
      console.error('Error loading questions:', e);
      if (localStorage.getItem('debug') === '1') {
        toast.error(`RLS error loading questions: ${errorMsg}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [propertyId]);

  // Calculate KPIs based on filtered data
  const pendingCount = questions.filter(q => q.status === 'pending').length;
  const totalCount = questions.length;
  const selectedProperty = properties.find(p => p.id === propertyId);

  // Get property name for display
  const getPropertyName = (propId: string) => {
    const prop = properties.find(p => p.id === propId);
    return prop?.nome || 'Proprietà sconosciuta';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-hostsuite-primary mb-2">Domande Senza Risposta</h1>
        <p className="text-hostsuite-text">Gestisci le domande degli ospiti che necessitano di una risposta manuale</p>
      </div>

        {/* Property Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-hostsuite-primary" />
              <span className="text-sm font-medium text-hostsuite-text">Proprietà:</span>
            </div>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger className="w-64" aria-label="Filtra per proprietà">
                <SelectValue placeholder="Seleziona proprietà" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le proprietà</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {propertyId !== 'all' && selectedProperty && (
              <Badge variant="outline" className="text-hostsuite-primary border-hostsuite-primary">
                Filtrate per: {selectedProperty.nome}
              </Badge>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-hostsuite-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-hostsuite-text">Domande in Attesa</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-hostsuite-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-hostsuite-text">Totale Domande</p>
                  <p className="text-2xl font-bold text-hostsuite-primary">{totalCount}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-hostsuite-primary/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-hostsuite-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-hostsuite-text">Risolte</p>
                  <p className="text-2xl font-bold text-green-600">
                    {questions.filter(q => q.status === 'resolved').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Questions List */}
        <Card className="border-hostsuite-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-hostsuite-primary">
              <HelpCircle className="w-6 h-6" />
              Domande Recenti
              {isLoading && <span className="text-sm font-normal text-hostsuite-text">(Caricamento...)</span>}
            </CardTitle>
            <CardDescription>
              Domande degli ospiti che richiedono la tua attenzione
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
            
            <div className="space-y-4">
              {questions.map((question) => (
                <div 
                  key={question.id}
                  className="p-4 border border-hostsuite-primary/20 rounded-lg hover:bg-hostsuite-primary/5 transition-colors"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusBadge(question.status)}
                          <span className="text-sm text-hostsuite-text">
                            {new Date(question.created_at).toLocaleString('it-IT')}
                          </span>
                        </div>
                        <h3 className="font-medium text-hostsuite-primary mb-2">
                          {question.question}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-hostsuite-text">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Guest Code: {question.guest_code}
                          </div>
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {getPropertyName(question.property_id)}
                          </div>
                        </div>
                      </div>
                      
                      {question.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" disabled>
                            Rispondi
                          </Button>
                          <Button size="sm" variant="outline" disabled>
                            Aggiungi a FAQ
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {questions.length === 0 && !isLoading && (
                <div className="text-center py-8">
                  <HelpCircle className="w-12 h-12 text-hostsuite-primary/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-hostsuite-text mb-2">
                    {propertyId !== 'all' 
                      ? `Nessuna domanda per ${selectedProperty?.nome || 'questa proprietà'}`
                      : "Nessuna domanda in sospeso"
                    }
                  </h3>
                  <p className="text-hostsuite-text/60">
                    {propertyId !== 'all'
                      ? "Non ci sono domande per la proprietà selezionata"
                      : "Tutte le domande degli ospiti hanno ricevuto risposta"
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
    </div>
  );
};

export default HostUnansweredQuestions;