begin;

-- Align with in-app appointment chat vs direct / DM rows (send-direct uses message_type = direct).
alter table public.messages
  add column if not exists message_type character varying not null default 'appointment';

commit;
