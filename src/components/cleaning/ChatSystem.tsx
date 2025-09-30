import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Send, Flag, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface ChatSystemProps {
  userType: 'host' | 'cleaner';
  userId: string;
  selectedConversationId?: string;
}

export default function ChatSystem({ userType, userId, selectedConversationId }: ChatSystemProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('chat-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_messages'
        },
        () => {
          if (selectedConv) {
            loadMessages(selectedConv.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedConversationId) {
      const conv = conversations.find(c => c.id === selectedConversationId);
      if (conv) {
        setSelectedConv(conv);
        loadMessages(conv.id);
      }
    }
  }, [selectedConversationId, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      let query = supabase
        .from('host_cleaner_conversations')
        .select(`
          *,
          cleaners (
            name,
            email,
            avatar_url
          ),
          properties (
            nome
          )
        `)
        .order('last_message_at', { ascending: false });

      if (userType === 'host') {
        const { data: { user } } = await supabase.auth.getUser();
        query = query.eq('host_id', user?.id);
      } else {
        const { data: cleanerData } = await supabase
          .from('cleaners')
          .select('id')
          .eq('user_id', userId)
          .single();
        
        if (cleanerData) {
          query = query.eq('cleaner_id', cleanerData.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      setConversations(data || []);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      toast.error('Errore nel caricamento delle conversazioni');
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      // Mark messages as read
      if (userType === 'host') {
        await supabase
          .from('conversation_messages')
          .update({ read_by_host: true })
          .eq('conversation_id', conversationId)
          .eq('read_by_host', false);
      } else {
        await supabase
          .from('conversation_messages')
          .update({ read_by_cleaner: true })
          .eq('conversation_id', conversationId)
          .eq('read_by_cleaner', false);
      }
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast.error('Errore nel caricamento dei messaggi');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non autenticato');

      const { error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: selectedConv.id,
          sender_type: userType,
          sender_id: user.id,
          content: newMessage,
          message_type: 'text'
        });

      if (error) throw error;

      setNewMessage('');
      loadMessages(selectedConv.id);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Errore nell\'invio del messaggio');
    } finally {
      setLoading(false);
    }
  };

  const flagConversation = async (reason: string) => {
    if (!selectedConv) return;

    try {
      const { error } = await supabase
        .from('host_cleaner_conversations')
        .update({
          flagged_for_support: true,
          flag_reason: reason,
          flagged_at: new Date().toISOString()
        })
        .eq('id', selectedConv.id);

      if (error) throw error;

      toast.success('Conversazione segnalata al supporto');
      loadConversations();
    } catch (error: any) {
      console.error('Error flagging conversation:', error);
      toast.error('Errore nella segnalazione');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
      {/* Conversations List */}
      <Card className="p-4 overflow-hidden flex flex-col">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Conversazioni
        </h3>
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  setSelectedConv(conv);
                  loadMessages(conv.id);
                }}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedConv?.id === conv.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {conv.cleaners?.name?.[0] || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {conv.cleaners?.name || 'Cleaner'}
                    </p>
                    <p className="text-sm opacity-70 truncate">
                      {conv.properties?.nome}
                    </p>
                    {conv.flagged_for_support && (
                      <Flag className="h-3 w-3 text-destructive inline-block" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Messages Panel */}
      <Card className="md:col-span-2 p-4 flex flex-col">
        {selectedConv ? (
          <>
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h3 className="font-semibold">{selectedConv.cleaners?.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedConv.properties?.nome}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const reason = prompt('Motivo della segnalazione:');
                  if (reason) flagConversation(reason);
                }}
              >
                <Flag className="h-4 w-4 mr-2" />
                Segnala
              </Button>
            </div>

            <ScrollArea className="flex-1 py-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender_type === userType ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.sender_type === userType
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      {msg.attachment_url && (
                        <img
                          src={msg.attachment_url}
                          alt="Attachment"
                          className="mt-2 rounded max-w-full"
                        />
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {format(new Date(msg.created_at), 'HH:mm', { locale: it })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="flex gap-2 pt-4 border-t">
              <Input
                placeholder="Scrivi un messaggio..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                disabled={loading}
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !newMessage.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Seleziona una conversazione per iniziare</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
