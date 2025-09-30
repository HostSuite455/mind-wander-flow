import { useState, useEffect } from "react";
import { Property } from "@/lib/properties";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClipboardList, Plus, Sparkles, Trash2, GripVertical, Camera, FileText, Check } from "lucide-react";

interface Props {
  property: Property;
}

interface ChecklistTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  is_default: boolean;
  items: ChecklistItem[];
}

interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  requires_photo: boolean;
  requires_note: boolean;
  order_index: number;
}

const PREDEFINED_TEMPLATES = [
  {
    name: "Pulizie Standard",
    category: "cleaning",
    description: "Checklist completa per le pulizie di routine",
    items: [
      { title: "Aspirare tutti i pavimenti", requires_photo: false, requires_note: false },
      { title: "Cambiare lenzuola e asciugamani", requires_photo: false, requires_note: false },
      { title: "Pulire bagno completamente", requires_photo: true, requires_note: false },
      { title: "Pulire cucina e svuotare frigo", requires_photo: true, requires_note: false },
      { title: "Controllare WiFi e telecomando", requires_photo: false, requires_note: false },
      { title: "Riordinare salotto", requires_photo: false, requires_note: false },
    ],
  },
  {
    name: "Check-out Ospiti",
    category: "checkout",
    description: "Controlli da fare dopo la partenza degli ospiti",
    items: [
      { title: "Verificare danni o oggetti rotti", requires_photo: true, requires_note: true },
      { title: "Contare asciugamani e biancheria", requires_photo: false, requires_note: true },
      { title: "Controllare elettrodomestici funzionanti", requires_photo: false, requires_note: false },
      { title: "Svuotare tutti i cestini", requires_photo: false, requires_note: false },
      { title: "Verificare chiavi e telecomandi", requires_photo: false, requires_note: true },
    ],
  },
  {
    name: "Manutenzione Mensile",
    category: "maintenance",
    description: "Controlli mensili preventivi",
    items: [
      { title: "Controllare filtri aria condizionata", requires_photo: true, requires_note: false },
      { title: "Verificare rubinetti e scarichi", requires_photo: false, requires_note: true },
      { title: "Testare allarme fumo", requires_photo: false, requires_note: false },
      { title: "Controllare elettrodomestici", requires_photo: false, requires_note: true },
    ],
  },
];

export function PropertyEditChecklists({ property }: Props) {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    category: "cleaning",
    description: "",
  });
  const [newItems, setNewItems] = useState<Omit<ChecklistItem, "id" | "order_index">[]>([]);

  useEffect(() => {
    loadTemplates();
  }, [property.id]);

  async function loadTemplates() {
    try {
      const { data, error } = await supabase
        .from("checklist_templates")
        .select(`
          *,
          checklist_items (*)
        `)
        .eq("property_id", property.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setTemplates(data.map((t: any) => ({
        ...t,
        items: t.checklist_items || [],
      })));

      // Mostra wizard solo se non ci sono template
      if (!data || data.length === 0) {
        setShowWizard(true);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Errore nel caricamento delle checklist");
    } finally {
      setLoading(false);
    }
  }

  async function createFromPredefined() {
    if (!selectedTemplate) return;

    const template = PREDEFINED_TEMPLATES.find((t) => t.name === selectedTemplate);
    if (!template) return;

    try {
      // Crea template
      const { data: newTemplate, error: templateError } = await supabase
        .from("checklist_templates")
        .insert({
          property_id: property.id,
          name: template.name,
          category: template.category,
          description: template.description,
          is_default: false,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Crea items
      const itemsToInsert = template.items.map((item, index) => ({
        template_id: newTemplate.id,
        title: item.title,
        requires_photo: item.requires_photo,
        requires_note: item.requires_note,
        order_index: index,
      }));

      const { error: itemsError } = await supabase
        .from("checklist_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success("Checklist creata con successo! ✨");
      setShowWizard(false);
      loadTemplates();
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error("Errore nella creazione della checklist");
    }
  }

  async function createCustomTemplate() {
    if (!newTemplate.name || newItems.length === 0) {
      toast.error("Inserisci nome e almeno un'attività");
      return;
    }

    try {
      // Crea template
      const { data: created, error: templateError } = await supabase
        .from("checklist_templates")
        .insert({
          property_id: property.id,
          ...newTemplate,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Crea items
      const itemsToInsert = newItems.map((item, index) => ({
        template_id: created.id,
        title: item.title,
        description: item.description,
        requires_photo: item.requires_photo,
        requires_note: item.requires_note,
        order_index: index,
      }));

      const { error: itemsError } = await supabase
        .from("checklist_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success("Checklist personalizzata creata! 🎉");
      setShowCreateDialog(false);
      setNewTemplate({ name: "", category: "cleaning", description: "" });
      setNewItems([]);
      loadTemplates();
    } catch (error) {
      console.error("Error creating custom template:", error);
      toast.error("Errore nella creazione della checklist");
    }
  }

  async function deleteTemplate(templateId: string) {
    try {
      const { error } = await supabase
        .from("checklist_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;

      toast.success("Checklist eliminata");
      loadTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Errore nell'eliminazione");
    }
  }

  const getCategoryBadge = (category: string) => {
    const styles = {
      cleaning: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
      checkout: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300",
      maintenance: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300",
      inspection: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300",
    };
    return styles[category as keyof typeof styles] || styles.cleaning;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Wizard onboarding
  if (showWizard) {
    return (
      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/50 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Benvenuto nel tuo Assistente Checklist!</CardTitle>
          <CardDescription className="text-base">
            Ti aiuto a creare checklist professionali per gli addetti. Iniziamo con un template pronto?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            {PREDEFINED_TEMPLATES.map((template) => (
              <Card
                key={template.name}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate === template.name
                    ? "border-2 border-primary bg-primary/5"
                    : "border hover:border-primary/50"
                }`}
                onClick={() => setSelectedTemplate(template.name)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{template.name}</h4>
                        <Badge className={getCategoryBadge(template.category)}>
                          {template.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="w-3 h-3" />
                        <span>{template.items.length} attività</span>
                      </div>
                    </div>
                    {selectedTemplate === template.name && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={createFromPredefined}
              disabled={!selectedTemplate}
              size="lg"
              className="flex-1"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Crea Checklist
            </Button>
            <Button onClick={() => setShowWizard(false)} variant="outline" size="lg">
              Crea da Zero
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Lista template esistenti
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Liste di Controllo</CardTitle>
              <CardDescription>
                Gestisci le checklist per questa proprietà
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuova Checklist
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crea Checklist Personalizzata</DialogTitle>
                  <DialogDescription>
                    Crea una checklist su misura per le tue esigenze
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome Checklist</Label>
                    <Input
                      placeholder="es. Pulizie Deluxe"
                      value={newTemplate.name}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select
                      value={newTemplate.category}
                      onValueChange={(value) =>
                        setNewTemplate({ ...newTemplate, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cleaning">Pulizie</SelectItem>
                        <SelectItem value="checkout">Check-out</SelectItem>
                        <SelectItem value="maintenance">Manutenzione</SelectItem>
                        <SelectItem value="inspection">Ispezione</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Descrizione</Label>
                    <Textarea
                      placeholder="Breve descrizione della checklist"
                      value={newTemplate.description}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, description: e.target.value })
                      }
                    />
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label>Attività</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setNewItems([
                            ...newItems,
                            {
                              title: "",
                              requires_photo: false,
                              requires_note: false,
                            },
                          ])
                        }
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Aggiungi
                      </Button>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {newItems.map((item, index) => (
                        <Card key={index} className="p-3">
                          <div className="space-y-3">
                            <div className="flex items-start gap-2">
                              <GripVertical className="w-4 h-4 text-muted-foreground mt-2" />
                              <Input
                                placeholder="Titolo attività"
                                value={item.title}
                                onChange={(e) => {
                                  const updated = [...newItems];
                                  updated[index].title = e.target.value;
                                  setNewItems(updated);
                                }}
                                className="flex-1"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setNewItems(newItems.filter((_, i) => i !== index))
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex gap-4 ml-6">
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox
                                  checked={item.requires_photo}
                                  onCheckedChange={(checked) => {
                                    const updated = [...newItems];
                                    updated[index].requires_photo = checked as boolean;
                                    setNewItems(updated);
                                  }}
                                />
                                <Camera className="w-4 h-4" />
                                Foto richiesta
                              </label>
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox
                                  checked={item.requires_note}
                                  onCheckedChange={(checked) => {
                                    const updated = [...newItems];
                                    updated[index].requires_note = checked as boolean;
                                    setNewItems(updated);
                                  }}
                                />
                                <FileText className="w-4 h-4" />
                                Note richieste
                              </label>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Annulla
                  </Button>
                  <Button onClick={createCustomTemplate}>Crea Checklist</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
              <h3 className="text-lg font-medium mb-2">Nessuna checklist ancora</h3>
              <p className="text-muted-foreground mb-6">
                Inizia con un template pronto o creane uno personalizzato
              </p>
              <Button onClick={() => setShowWizard(true)} variant="outline">
                <Sparkles className="w-4 h-4 mr-2" />
                Guida Rapida
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{template.name}</h4>
                          <Badge className={getCategoryBadge(template.category)}>
                            {template.category}
                          </Badge>
                        </div>
                        {template.description && (
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {template.items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <Check className="w-3 h-3" />
                          <span>{item.title}</span>
                          {item.requires_photo && <Camera className="w-3 h-3 ml-auto" />}
                          {item.requires_note && <FileText className="w-3 h-3" />}
                        </div>
                      ))}
                      {template.items.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{template.items.length - 3} altre attività
                        </p>
                      )}
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
