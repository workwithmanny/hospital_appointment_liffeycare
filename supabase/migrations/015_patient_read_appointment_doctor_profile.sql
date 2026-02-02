begin;

-- Allow patients to read their appointment doctor's profile (e.g. chat presence, header)
-- beyond the public "approved directory" policy (handles unlisted / legacy cases).
drop policy if exists "patient read appointment doctor profile" on public.profiles;
create policy "patient read appointment doctor profile" on public.profiles
for select using (
  role = 'doctor'
  and exists (
    select 1
    from public.appointments a
    where a.patient_id = auth.uid()
      and a.doctor_id = profiles.id
  )
);

commit;
