-- Enable realtime for appointments table to support session notifications
-- This allows the SessionNotificationProvider to receive live updates

-- First, check if the publications table exists and create publication if needed
DO $$
BEGIN
    -- Enable realtime for the appointments table
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'appointments'
    ) THEN
        -- Already enabled
        RAISE NOTICE 'Realtime already enabled for appointments table';
    ELSE
        -- Add appointments to the publication
        ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
        RAISE NOTICE 'Enabled realtime for appointments table';
    END IF;
END $$;

-- Ensure RLS policies allow users to receive realtime updates for their appointments
-- Users should be able to receive updates for appointments where they are doctor or patient

-- Policy for patients to see their appointments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'appointments' 
        AND policyname = 'appointments_realtime_patient'
    ) THEN
        CREATE POLICY appointments_realtime_patient ON public.appointments
            FOR SELECT
            TO authenticated
            USING (patient_id = auth.uid());
        RAISE NOTICE 'Created patient realtime policy';
    END IF;
END $$;

-- Policy for doctors to see their appointments
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'appointments' 
        AND policyname = 'appointments_realtime_doctor'
    ) THEN
        CREATE POLICY appointments_realtime_doctor ON public.appointments
            FOR SELECT
            TO authenticated
            USING (doctor_id = auth.uid());
        RAISE NOTICE 'Created doctor realtime policy';
    END IF;
END $$;

-- Create function to notify on appointment changes for realtime events
CREATE OR REPLACE FUNCTION public.handle_appointment_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger for status changes or join events
    IF (
        OLD.status IS DISTINCT FROM NEW.status OR
        OLD.doctor_joined_at IS DISTINCT FROM NEW.doctor_joined_at OR
        OLD.patient_joined_at IS DISTINCT FROM NEW.patient_joined_at OR
        OLD.session_started_at IS DISTINCT FROM NEW.session_started_at
    ) THEN
        -- Broadcast the change via realtime
        PERFORM pg_notify(
            'appointment_changes',
            json_build_object(
                'id', NEW.id,
                'doctor_id', NEW.doctor_id,
                'patient_id', NEW.patient_id,
                'status', NEW.status,
                'doctor_joined_at', NEW.doctor_joined_at,
                'patient_joined_at', NEW.patient_joined_at,
                'session_started_at', NEW.session_started_at,
                'changed_at', NOW()
            )::text
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for appointment notifications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'appointment_notification_trigger'
    ) THEN
        CREATE TRIGGER appointment_notification_trigger
            AFTER UPDATE ON public.appointments
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_appointment_notification();
        RAISE NOTICE 'Created appointment notification trigger';
    END IF;
END $$;

-- Enable realtime for messages table so chat works properly too
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
        RAISE NOTICE 'Enabled realtime for messages table';
    END IF;
END $$;
