-- ============================================
-- STEP 1: Cleaner Invitations System
-- ============================================
CREATE TABLE IF NOT EXISTS public.cleaner_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  invitation_code TEXT NOT NULL UNIQUE,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  cleaner_id UUID REFERENCES public.cleaners(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cleaner_invitations_code ON public.cleaner_invitations(invitation_code);
CREATE INDEX idx_cleaner_invitations_property ON public.cleaner_invitations(property_id);
CREATE INDEX idx_cleaner_invitations_status ON public.cleaner_invitations(status);

-- RLS for cleaner_invitations
ALTER TABLE public.cleaner_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts manage their invitations"
ON public.cleaner_invitations
FOR ALL
USING (host_id = auth.uid());

CREATE POLICY "Anyone can view pending invitations by code"
ON public.cleaner_invitations
FOR SELECT
USING (status = 'pending' AND expires_at > NOW());

-- ============================================
-- STEP 2: Host ↔ Cleaner Chat System
-- ============================================
CREATE TABLE IF NOT EXISTS public.host_cleaner_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cleaner_id UUID NOT NULL REFERENCES public.cleaners(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  flagged_for_support BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  flagged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(host_id, cleaner_id, property_id)
);

CREATE INDEX idx_conversations_host ON public.host_cleaner_conversations(host_id);
CREATE INDEX idx_conversations_cleaner ON public.host_cleaner_conversations(cleaner_id);
CREATE INDEX idx_conversations_flagged ON public.host_cleaner_conversations(flagged_for_support) WHERE flagged_for_support = TRUE;

CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.host_cleaner_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('host', 'cleaner', 'support')),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document')),
  content TEXT NOT NULL,
  attachment_url TEXT,
  read_by_host BOOLEAN DEFAULT FALSE,
  read_by_cleaner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON public.conversation_messages(conversation_id);
CREATE INDEX idx_messages_created ON public.conversation_messages(created_at DESC);

-- RLS for conversations
ALTER TABLE public.host_cleaner_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts view their conversations"
ON public.host_cleaner_conversations
FOR SELECT
USING (host_id = auth.uid());

CREATE POLICY "Cleaners view their conversations"
ON public.host_cleaner_conversations
FOR SELECT
USING (cleaner_id IN (
  SELECT id FROM public.cleaners WHERE user_id = auth.uid()
));

CREATE POLICY "Hosts manage their conversations"
ON public.host_cleaner_conversations
FOR ALL
USING (host_id = auth.uid());

CREATE POLICY "Cleaners flag conversations"
ON public.host_cleaner_conversations
FOR UPDATE
USING (cleaner_id IN (
  SELECT id FROM public.cleaners WHERE user_id = auth.uid()
));

-- RLS for messages
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversation participants view messages"
ON public.conversation_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.host_cleaner_conversations c
    WHERE c.id = conversation_messages.conversation_id
    AND (c.host_id = auth.uid() OR c.cleaner_id IN (
      SELECT id FROM public.cleaners WHERE user_id = auth.uid()
    ))
  )
);

CREATE POLICY "Conversation participants send messages"
ON public.conversation_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.host_cleaner_conversations c
    WHERE c.id = conversation_messages.conversation_id
    AND (c.host_id = auth.uid() OR c.cleaner_id IN (
      SELECT id FROM public.cleaners WHERE user_id = auth.uid()
    ))
  )
);

-- ============================================
-- STEP 3: Payment System Tables
-- ============================================
CREATE TABLE IF NOT EXISTS public.automatic_payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.cleaning_tasks(id) ON DELETE CASCADE,
  cleaner_id UUID NOT NULL REFERENCES public.cleaners(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_automatic_payments_task ON public.automatic_payment_logs(task_id);
CREATE INDEX idx_automatic_payments_cleaner ON public.automatic_payment_logs(cleaner_id);
CREATE INDEX idx_automatic_payments_status ON public.automatic_payment_logs(status);

CREATE TABLE IF NOT EXISTS public.manual_payment_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cleaner_id UUID NOT NULL REFERENCES public.cleaners(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_amount_cents INTEGER NOT NULL,
  task_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'disputed')),
  payment_method TEXT,
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_manual_batches_host ON public.manual_payment_batches(host_id);
CREATE INDEX idx_manual_batches_cleaner ON public.manual_payment_batches(cleaner_id);
CREATE INDEX idx_manual_batches_status ON public.manual_payment_batches(status);

-- RLS for payment tables
ALTER TABLE public.automatic_payment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts view their payment logs"
ON public.automatic_payment_logs
FOR SELECT
USING (host_id = auth.uid());

CREATE POLICY "Cleaners view their payments"
ON public.automatic_payment_logs
FOR SELECT
USING (cleaner_id IN (
  SELECT id FROM public.cleaners WHERE user_id = auth.uid()
));

ALTER TABLE public.manual_payment_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts manage manual payments"
ON public.manual_payment_batches
FOR ALL
USING (host_id = auth.uid());

CREATE POLICY "Cleaners view their manual payments"
ON public.manual_payment_batches
FOR SELECT
USING (cleaner_id IN (
  SELECT id FROM public.cleaners WHERE user_id = auth.uid()
));

-- ============================================
-- STEP 4: Realtime Setup
-- ============================================
-- Enable realtime for conversations and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.host_cleaner_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;

-- ============================================
-- STEP 5: Helper Functions
-- ============================================

-- Function to auto-update last_message_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.host_cleaner_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
AFTER INSERT ON public.conversation_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- Function to generate unique invitation code
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := encode(gen_random_bytes(8), 'base64');
    code := replace(replace(replace(code, '+', ''), '/', ''), '=', '');
    code := substring(code, 1, 12);
    
    SELECT EXISTS(SELECT 1 FROM public.cleaner_invitations WHERE invitation_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;