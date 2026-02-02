begin;

create policy "approved doctor directory read" on public.profiles
for select using (role = 'doctor' and doctor_approved = true);

create policy "doctor own availability read" on public.doctor_availability
for select using (auth.uid() = doctor_id);

create policy "doctor own availability insert" on public.doctor_availability
for insert with check (auth.uid() = doctor_id);

create policy "doctor own availability update" on public.doctor_availability
for update using (auth.uid() = doctor_id);

create policy "doctor own availability delete" on public.doctor_availability
for delete using (auth.uid() = doctor_id);

commit;
