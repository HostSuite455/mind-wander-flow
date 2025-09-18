import { useState, useEffect } from "react";
import { supaSelect } from "@/lib/supaSafe";
import { toCSV, downloadCSV } from "@/lib/csv";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { Download, Database, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useActiveProperty } from "@/hooks/useActiveProperty";

type AnyRow = Record<string, any>;

interface DatasetPanel {
  title: string;
  table: string;
  columns: string;
  data: AnyRow[];
  loading: boolean;
  error: any;
}

export default function Export() {
  const { toast } = useToast();
  const { id: activePropertyId } = useActiveProperty();
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [datasets, setDatasets] = useState<DatasetPanel[]>([
    { title: "Proprietà", table: "properties", columns: "id, host_id, nome, city, max_guests, status, created_at", data: [], loading: true, error: null },
    { title: "Configurazioni iCal", table: "ical_configs", columns: "id, property_id, channel_manager_name, config_type, is_active, last_sync_at, created_at", data: [], loading: true, error: null },
    { title: "URL iCal", table: "ical_urls", columns: "id, property_id, source, url, is_active, last_sync_at, created_at", data: [], loading: true, error: null },
    { title: "Domande non risposte", table: "unanswered_questions", columns: "id, property_id, question, guest_code, created_at, status", data: [], loading: true, error: null }
  ]);

  useEffect(() => {
    const loadAllData = async () => {
      const promises = datasets.map(async (dataset, index) => {
        const { data, error } = await supaSelect(dataset.table, dataset.columns);
        return { index, data, error };
      });

      const results = await Promise.all(promises);
      
      setDatasets(prev => prev.map((dataset, index) => {
        const result = results.find(r => r.index === index);
        return {
          ...dataset,
          data: result?.data || [],
          error: result?.error,
          loading: false
        };
      }));
    };

    loadAllData();
  }, []);

  const handleExport = (dataset: DatasetPanel) => {
    if (dataset.data.length === 0) {
      toast({
        title: "Nessun dato da esportare",
        description: `Il dataset "${dataset.title}" è vuoto.`,
        variant: "destructive"
      });
      return;
    }

    const csv = toCSV(dataset.data);
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `hostsuite-${dataset.table}-${timestamp}.csv`;
    
    downloadCSV(filename, csv);
    
    toast({
      title: "Export completato",
      description: `File ${filename} scaricato con successo.`
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Database className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Centro Export</h1>
          <p className="text-muted-foreground">Esporta i tuoi dati in formato CSV</p>
        </div>
      </div>

      {/* Active property badge */}
      {activePropertyId !== 'all' && (
        <Badge variant="outline" className="flex items-center gap-2 w-fit">
          <Info className="h-3 w-3" />
          Proprietà attiva filtrata
        </Badge>
      )}

      {/* Pill toggle for showing only active property data */}
      {activePropertyId !== 'all' && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Visualizzazione dati:</span>
          <div className="flex items-center gap-2">
            <Toggle 
              pressed={!showOnlyActive}
              onPressedChange={(pressed) => setShowOnlyActive(!pressed)}
              aria-label="Mostra tutti i dati"
            >
              Tutte le proprietà
            </Toggle>
            <Toggle 
              pressed={showOnlyActive}
              onPressedChange={setShowOnlyActive}
              aria-label="Mostra solo proprietà attiva"
            >
              Solo attiva
            </Toggle>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {datasets.map((dataset, index) => {
          // Filter data if showOnlyActive is true and activePropertyId is set
          const displayData = (showOnlyActive && activePropertyId !== 'all') 
            ? dataset.data.filter(row => row.property_id === activePropertyId)
            : dataset.data;

          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg">{dataset.title}</CardTitle>
                <PrimaryButton
                  onClick={() => handleExport({...dataset, data: displayData})}
                  disabled={dataset.loading || displayData.length === 0}
                  size="sm"
                  aria-label={`Esporta ${dataset.title} in formato CSV`}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Esporta CSV
                </PrimaryButton>
              </CardHeader>
              
              <CardContent>
                {dataset.loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : dataset.error ? (
                  <Alert>
                    <AlertDescription>
                      Errore nel caricamento dei dati: {dataset.error.message || 'Errore sconosciuto'}
                    </AlertDescription>
                  </Alert>
                ) : displayData.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    {(showOnlyActive && activePropertyId !== 'all') 
                      ? "Nessun dato per la proprietà attiva"
                      : "Nessun dato disponibile (possibile restrizione RLS)"
                    }
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {displayData.length} record{displayData.length !== 1 ? 's' : ''} disponibili
                      {showOnlyActive && activePropertyId !== 'all' && (
                        <span className="ml-1 text-xs">(filtrati)</span>
                      )}
                    </p>
                    
                    {/* Preview table */}
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="w-full text-xs">
                        <thead className="bg-muted">
                          <tr>
                            {Object.keys(displayData[0] || {}).slice(0, 4).map(key => (
                              <th key={key} className="text-left py-2 px-3 font-medium">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {displayData.slice(0, 3).map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-t">
                              {Object.values(row).slice(0, 4).map((value: any, colIndex) => (
                                <td key={colIndex} className="py-2 px-3 max-w-[100px] truncate">
                                  {value === null || value === undefined ? '—' : String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {displayData.length > 3 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        ... e altri {displayData.length - 3} record
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}