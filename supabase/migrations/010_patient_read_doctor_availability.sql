begin;

-- Allow patients (and any authenticated user) to read approved doctors' availability.
drop policy if exists "approved doctor availability read" on public.doctor_availability;
create policy "approved doctor availability read" on public.doctor_availability
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = doctor_availability.doctor_id
      and p.role = 'doctor'
      and p.doctor_approved = true
  )
);

commit;

