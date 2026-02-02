begin;

-- Add policy for patients to send messages to doctors
create policy "patient can send to own appointment doctor" on public.messages
for insert with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.appointments a
    where a.id = messages.appointment_id
      and a.patient_id = auth.uid()
      and a.doctor_id = messages.recipient_id
  )
);

commit;
