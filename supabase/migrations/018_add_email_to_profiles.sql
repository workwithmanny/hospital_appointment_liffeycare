BEGIN;

-- Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Update the handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, phone, email, doctor_approved)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'role', 'patient'),
    COALESCE(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data ->> 'phone', null),
    new.email, -- This is the email from auth.users
    CASE WHEN COALESCE(new.raw_user_meta_data ->> 'role', 'patient') = 'doctor' THEN false ELSE true END
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN new;
END;
$$;

COMMIT;
