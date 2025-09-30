import { useState, useEffect } from "react";
import { Property } from "@/lib/properties";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, Plus, AlertTriangle, TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";

interface Props {
  property: Property;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  min_threshold: number;
  max_threshold: number;
  unit: string;
  cost_per_unit?: number;
  auto_reorder: boolean;
}

const CATEGORY_PRESETS = [
  { value: "linens", label: "Biancheria", icon: "🛏️", items: ["Lenzuola", "Asciugamani", "Copriletti", "Federe"] },
  { value: "toiletries", label: "Cortesia", icon: "🧴", items: ["Shampoo", "Bagnoschiuma", "Sapone", "Carta igienica"] },
  { value: "consumables", label: "Consumabili", icon: "🧹", items: ["Detersivi", "Sacchetti spazzatura", "Spugne", "Carta casa"] },
  { value: "equipment", label: "Attrezzatura", icon: "🔧", items: ["Scope", "Aspirapolvere", "Ferro da stiro", "Phon"] },
];

export function PropertyEditInventory({ property }: Props) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "linens",
    current_stock: 10,
    min_threshold: 5,
    max_threshold: 50,
    unit: "pieces",
    cost_per_unit: 0,
    auto_reorder: false,
  });

  useEffect(() => {
    loadInventory();
  }, [property.id]);

  async function loadInventory() {
    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("property_id", property.id)
        .order("category", { ascending: true });

      if (error) throw error;

      setItems(data || []);
      
      // Mostra quick start se inventario vuoto
      if (!data || data.length === 0) {
        setShowQuickStart(true);
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
      toast.error("Errore nel caricamento dell'inventario");
    } finally {
      setLoading(false);
    }
  }

  async function addItem() {
    if (!newItem.name) {
      toast.error("Inserisci il nome dell'articolo");
      return;
    }

    try {
      const { error } = await supabase.from("inventory_items").insert({
        property_id: property.id,
        ...newItem,
      });

      if (error) throw error;

      toast.success("Articolo aggiunto all'inventario! 📦");
      setShowAddDialog(false);
      setNewItem({
        name: "",
        category: "linens",
        current_stock: 10,
        min_threshold: 5,
        max_threshold: 50,
        unit: "pieces",
        cost_per_unit: 0,
        auto_reorder: false,
      });
      loadInventory();
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Errore nell'aggiunta dell'articolo");
    }
  }

  async function quickAddFromPreset(categoryValue: string) {
    const category = CATEGORY_PRESETS.find((c) => c.value === categoryValue);
    if (!category) return;

    try {
      const itemsToAdd = category.items.map((name) => ({
        property_id: property.id,
        name,
        category: categoryValue,
        current_stock: 10,
        min_threshold: 5,
        max_threshold: 50,
        unit: "pieces",
        auto_reorder: false,
      }));

      const { error } = await supabase.from("inventory_items").insert(itemsToAdd);

      if (error) throw error;

      toast.success(`${category.label} aggiunti! ✨`);
      setShowQuickStart(false);
      loadInventory();
    } catch (error) {
      console.error("Error adding preset items:", error);
      toast.error("Errore nell'aggiunta degli articoli");
    }
  }

  async function updateStock(itemId: string, change: number) {
    try {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      const newStock = Math.max(0, item.current_stock + change);

      const { error } = await supabase
        .from("inventory_items")
        .update({ current_stock: newStock })
        .eq("id", itemId);

      if (error) throw error;

      // Registra movimento
      await supabase.from("inventory_movements").insert({
        item_id: itemId,
        movement_type: change > 0 ? "in" : "out",
        quantity: Math.abs(change),
        reason: change > 0 ? "Riordino" : "Utilizzo",
      });

      loadInventory();
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Errore nell'aggiornamento");
    }
  }

  const getStockStatus = (item: InventoryItem) => {
    const percentage = (item.current_stock / item.max_threshold) * 100;
    if (item.current_stock <= item.min_threshold) {
      return { color: "bg-red-500", label: "Critico", variant: "destructive" as const };
    }
    if (percentage < 30) {
      return { color: "bg-orange-500", label: "Basso", variant: "secondary" as const };
    }
    if (percentage < 70) {
      return { color: "bg-yellow-500", label: "Medio", variant: "secondary" as const };
    }
    return { color: "bg-green-500", label: "OK", variant: "default" as const };
  };

  const getCategoryIcon = (category: string) => {
    const preset = CATEGORY_PRESETS.find((c) => c.value === category);
    return preset?.icon || "📦";
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Quick Start Wizard
  if (showQuickStart) {
    return (
      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/50 rounded-full flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Iniziamo con l'inventario!</CardTitle>
          <CardDescription className="text-base">
            Scegli una categoria per aggiungere velocemente gli articoli essenziali
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {CATEGORY_PRESETS.map((category) => (
              <Card
                key={category.value}
                className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
                onClick={() => quickAddFromPreset(category.value)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{category.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{category.label}</h4>
                      <p className="text-sm text-muted-foreground">
                        {category.items.join(", ")}
                      </p>
                    </div>
                    <Plus className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button onClick={() => setShowQuickStart(false)} variant="outline" className="w-full">
            Aggiungi Manualmente
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Main inventory view
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Articoli Totali</p>
                <p className="text-2xl font-bold">{items.length}</p>
              </div>
              <Package className="w-8 h-8 text-muted-foreground opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alert Scorte</p>
                <p className="text-2xl font-bold text-orange-500">
                  {items.filter((i) => i.current_stock <= i.min_threshold).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Auto-riordino</p>
                <p className="text-2xl font-bold text-green-500">
                  {items.filter((i) => i.auto_reorder).length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestione Inventario</CardTitle>
              <CardDescription>Monitora e gestisci le scorte</CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi Articolo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuovo Articolo</DialogTitle>
                  <DialogDescription>Aggiungi un articolo all'inventario</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome Articolo</Label>
                    <Input
                      placeholder="es. Asciugamani bianchi"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select
                        value={newItem.category}
                        onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORY_PRESETS.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.icon} {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Unità</Label>
                      <Select
                        value={newItem.unit}
                        onValueChange={(value) => setNewItem({ ...newItem, unit: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pieces">Pezzi</SelectItem>
                          <SelectItem value="sets">Set</SelectItem>
                          <SelectItem value="bottles">Bottiglie</SelectItem>
                          <SelectItem value="kg">Kg</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Scorte Attuali</Label>
                      <Input
                        type="number"
                        value={newItem.current_stock}
                        onChange={(e) =>
                          setNewItem({ ...newItem, current_stock: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Soglia Min</Label>
                      <Input
                        type="number"
                        value={newItem.min_threshold}
                        onChange={(e) =>
                          setNewItem({ ...newItem, min_threshold: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Soglia Max</Label>
                      <Input
                        type="number"
                        value={newItem.max_threshold}
                        onChange={(e) =>
                          setNewItem({ ...newItem, max_threshold: parseInt(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Annulla
                  </Button>
                  <Button onClick={addItem}>Aggiungi</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
              <h3 className="text-lg font-medium mb-2">Nessun articolo ancora</h3>
              <p className="text-muted-foreground mb-6">
                Inizia aggiungendo gli articoli essenziali
              </p>
              <Button onClick={() => setShowQuickStart(true)} variant="outline">
                Guida Rapida
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([category, categoryItems]) => (
                <div key={category}>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span className="text-xl">{getCategoryIcon(category)}</span>
                    {CATEGORY_PRESETS.find((c) => c.value === category)?.label || category}
                  </h3>
                  <div className="space-y-3">
                    {categoryItems.map((item) => {
                      const status = getStockStatus(item);
                      const stockPercentage =
                        (item.current_stock / item.max_threshold) * 100;

                      return (
                        <Card key={item.id} className="hover:shadow-sm transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium">{item.name}</h4>
                                  <Badge variant={status.variant}>{status.label}</Badge>
                                  {item.current_stock <= item.min_threshold && (
                                    <AlertCircle className="w-4 h-4 text-orange-500" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {item.current_stock} / {item.max_threshold} {item.unit}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStock(item.id, -1)}
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateStock(item.id, 1)}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <Progress value={stockPercentage} className="h-2" />
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
