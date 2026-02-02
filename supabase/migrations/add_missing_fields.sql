-- Migration to add missing fields to profiles and appointments tables
-- Run this in Supabase SQL Editor to update your database schema

-- Add missing fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS consultation_price decimal(10,2),
ADD COLUMN IF NOT EXISTS specialty text;

-- Add missing fields to appointments table  
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS payment_method text check (payment_method in ('pay_at_clinic', 'dummy_online')),
ADD COLUMN IF NOT EXISTS payment_status text check (payment_status in ('pending', 'paid', 'refunded')) default 'pending',
ADD COLUMN IF NOT EXISTS amount_paid decimal(10,2) default 0,
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS cancelled_by uuid references public.profiles(id),
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- Update existing appointments to have default payment method if null
UPDATE public.appointments 
SET payment_method = 'pay_at_clinic' 
WHERE payment_method IS NULL;

-- Update existing appointments to have default payment status if null  
UPDATE public.appointments 
SET payment_status = 'pending' 
WHERE payment_status IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.consultation_price IS 'Doctor consultation fee';
COMMENT ON COLUMN public.profiles.specialty IS 'Medical specialty of the doctor';
COMMENT ON COLUMN public.appointments.payment_method IS 'How the patient will pay (pay_at_clinic or dummy_online)';
COMMENT ON COLUMN public.appointments.payment_status IS 'Current payment status (pending, paid, refunded)';
COMMENT ON COLUMN public.appointments.amount_paid IS 'Amount actually paid for the appointment';
COMMENT ON COLUMN public.appointments.cancellation_reason IS 'Reason why the appointment was cancelled';
COMMENT ON COLUMN public.appointments.cancelled_by IS 'User who cancelled the appointment (patient or doctor)';
COMMENT ON COLUMN public.appointments.cancelled_at IS 'When the appointment was cancelled';
