CREATE TABLE public.contact_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  is_read boolean NOT NULL DEFAULT false,
  is_resolved boolean NOT NULL DEFAULT false,
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone,
  resolved_at timestamp with time zone,
  handled_by uuid,
  CONSTRAINT contact_messages_pkey PRIMARY KEY (id),
  CONSTRAINT contact_messages_handled_by_fkey FOREIGN KEY (handled_by) REFERENCES public.profiles(id)
);

-- Add index for querying unread messages
CREATE INDEX idx_contact_messages_unread ON public.contact_messages(is_read, created_at DESC);

-- Add index for category filtering
CREATE INDEX idx_contact_messages_category ON public.contact_messages(category, created_at DESC);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (for public contact form)
CREATE POLICY "Allow public to submit contact messages" ON public.contact_messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Policy: Only admins can view and update
CREATE POLICY "Only admins can view contact messages" ON public.contact_messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update contact messages" ON public.contact_messages
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages;
