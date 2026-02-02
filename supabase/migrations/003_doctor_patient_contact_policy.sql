begin;

create policy "doctor can read own patients profile contact" on public.profiles
for select using (
  exists (
    select 1
    from public.appointments a
    where a.doctor_id = auth.uid()
      and a.patient_id = profiles.id
  )
);

commit;
