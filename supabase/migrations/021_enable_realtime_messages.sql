begin;

-- Enable realtime for messages table
-- This is required for Supabase to broadcast changes via websockets
alter table public.messages replica identity full;

-- Add messages table to supabase_realtime publication
-- First check if the publication exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime FOR TABLE public.messages;
  ELSE
    -- Publication exists, check if messages table is already added
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'messages'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
  END IF;
END
$$;

commit;
