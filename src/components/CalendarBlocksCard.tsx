import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, MoreHorizontal, Copy, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { listCalendarBlocks, createCalendarBlock, updateCalendarBlock, deleteCalendarBlock, type CalendarBlock } from "@/lib/supaBlocks";

interface CalendarBlocksCardProps {
  propertyId: string;
  propertyName: string;
}

interface BlockFormData {
  start_date: string;
  end_date: string;
  reason: string;
  is_active: boolean;
}

export const CalendarBlocksCard = ({ propertyId, propertyName }: CalendarBlocksCardProps) => {
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<BlockFormData>({
    start_date: '',
    end_date: '',
    reason: '',
    is_active: true
  });

  const feedUrl = `https://blsiiqhijlubzhpmtswc.supabase.co/functions/v1/ical-feed/${propertyId}`;

  useEffect(() => {
    loadBlocks();
  }, [propertyId]);

  const loadBlocks = async () => {
    setLoading(true);
    const { data } = await listCalendarBlocks(propertyId);
    setBlocks(data);
    setLoading(false);
  };

  const handleCreateBlock = async () => {
    if (!formData.start_date || !formData.end_date) {
      toast({
        title: "Errore",
        description: "Date di inizio e fine sono obbligatorie",
        variant: "destructive"
      });
      return;
    }

    if (formData.end_date < formData.start_date) {
      toast({
        title: "Errore", 
        description: "La data di fine deve essere successiva alla data di inizio",
        variant: "destructive"
      });
      return;
    }

    const { data } = await createCalendarBlock({
      property_id: propertyId,
      ...formData
    });

    if (data) {
      setBlocks(prev => [...prev, data]);
      setIsCreateModalOpen(false);
      setFormData({
        start_date: '',
        end_date: '',
        reason: '',
        is_active: true
      });
    }
  };

  const handleToggleBlock = async (blockId: string, isActive: boolean) => {
    const { data } = await updateCalendarBlock(blockId, { is_active: isActive });
    if (data) {
      setBlocks(prev => 
        prev.map(block => 
          block.id === blockId ? { ...block, is_active: isActive } : block
        )
      );
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    const { error } = await deleteCalendarBlock(blockId);
    if (!error) {
      setBlocks(prev => prev.filter(block => block.id !== blockId));
    }
  };

  const copyFeedUrl = () => {
    navigator.clipboard.writeText(feedUrl);
    toast({
      title: "Copiato!",
      description: "URL del feed iCal copiato negli appunti"
    });
  };

  const openFeedUrl = () => {
    window.open(feedUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Calendar Blocks Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Blocchi Calendario - {propertyName}
            </CardTitle>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-hostsuite-primary text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Blocca Date
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuovo Blocco Calendario</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">Data Inizio</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">Data Fine</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="reason">Motivo (opzionale)</Label>
                    <Textarea
                      id="reason"
                      placeholder="Es: Manutenzione, Personal use, etc."
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Attivo</Label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Annulla
                    </Button>
                    <Button onClick={handleCreateBlock} className="bg-hostsuite-primary text-white">
                      Crea Blocco
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Caricamento blocchi...
            </div>
          ) : blocks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessun blocco calendario presente</p>
              <p className="text-sm">Crea il primo blocco per gestire la disponibilità</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Date</th>
                    <th className="text-left py-2 px-3">Motivo</th>
                    <th className="text-left py-2 px-3">Stato</th>
                    <th className="text-left py-2 px-3">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.map((block) => (
                    <tr key={block.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3">
                        {new Date(block.start_date).toLocaleDateString('it-IT')} - {' '}
                        {new Date(block.end_date).toLocaleDateString('it-IT')}
                      </td>
                      <td className="py-2 px-3 max-w-xs truncate" title={block.reason}>
                        {block.reason || '—'}
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant={block.is_active ? "default" : "secondary"}>
                          {block.is_active ? 'Attivo' : 'Disattivo'}
                        </Badge>
                      </td>
                      <td className="py-2 px-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleToggleBlock(block.id, !block.is_active)}
                            >
                              {block.is_active ? 'Disattiva' : 'Attiva'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteBlock(block.id)}
                              className="text-destructive"
                            >
                              Elimina
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* iCal Feed Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Feed iCal Esportazione
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Incolla questo feed su Smoobu, Airbnb, Booking.com o altri channel manager per sincronizzare i blocchi da HostSuite.
            </p>
            <div className="flex items-center space-x-2">
              <Input
                value={feedUrl}
                readOnly
                className="flex-1 font-mono text-xs"
              />
              <Button variant="outline" size="sm" onClick={copyFeedUrl}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={openFeedUrl}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>• Il feed si aggiorna automaticamente ogni 5 minuti</p>
              <p>• Include solo i blocchi attivi per questa proprietà</p>
              <p>• Compatibile con tutti i principali channel manager</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};