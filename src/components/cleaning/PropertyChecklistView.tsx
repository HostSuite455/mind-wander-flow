import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface PropertyChecklistViewProps {
  propertyId: string;
  taskId: string;
}

interface ChecklistTemplate {
  id: string;
  name: string;
  category: string;
  checklist_items: Array<{
    id: string;
    title: string;
    description: string | null;
  }>;
}

export function PropertyChecklistView({ propertyId, taskId }: PropertyChecklistViewProps) {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadChecklists();
  }, [propertyId, taskId]);
  
  async function loadChecklists() {
    try {
      // Load templates with items
      const { data: templatesData } = await supabase
        .from('checklist_templates')
        .select(`
          id,
          name,
          category,
          checklist_items (
            id,
            title,
            description
          )
        `)
        .eq('property_id', propertyId)
        .order('category');
      
      if (templatesData) {
        setTemplates(templatesData as any);
      }
      
    } catch (error) {
      console.error('Error loading checklists:', error);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleToggle(itemId: string, checked: boolean) {
    setCompletions(prev => ({ ...prev, [itemId]: checked }));
    
    // Save to DB (simplified - in produzione salvare in task_checklists + checklist_completions)
    console.log('Checklist item toggled:', itemId, checked);
  }
  
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  if (templates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📋 Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nessuna checklist configurata per questa proprietà.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">📋 Checklist Pulizia</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {templates.map((template) => (
            <AccordionItem key={template.id} value={template.id}>
              <AccordionTrigger className="text-sm font-medium">
                {template.name}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pl-2">
                  {template.checklist_items.map((item) => (
                    <div key={item.id} className="flex items-start gap-2">
                      <Checkbox
                        id={item.id}
                        checked={completions[item.id] || false}
                        onCheckedChange={(checked) => handleToggle(item.id, checked as boolean)}
                      />
                      <label
                        htmlFor={item.id}
                        className="text-sm leading-tight cursor-pointer"
                      >
                        <div className="font-medium">{item.title}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
