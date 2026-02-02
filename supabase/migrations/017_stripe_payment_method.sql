begin;

alter table public.appointments
  drop constraint if exists appointments_payment_method_check;

alter table public.appointments
  add constraint appointments_payment_method_check
  check (payment_method in ('pay_at_clinic', 'dummy_online', 'stripe'));

commit;
