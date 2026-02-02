-- Enable realtime for appointment notifications
-- This allows doctors to receive realtime notifications when patients book appointments

-- Add app_notifications to realtime publication if not already there
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'app_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE app_notifications;
  END IF;
END $$;

-- Create function to auto-create notification when appointment is booked
CREATE OR REPLACE FUNCTION create_appointment_booked_notification()
RETURNS TRIGGER AS $$
DECLARE
  patient_name TEXT;
BEGIN
  -- Get patient info
  SELECT full_name INTO patient_name
  FROM profiles
  WHERE id = NEW.patient_id;

  -- Only create notification if one doesn't already exist for this appointment
  IF NOT EXISTS (
    SELECT 1 FROM app_notifications 
    WHERE appointment_id = NEW.id 
    AND kind = 'appointment_booked'
  ) THEN
    INSERT INTO app_notifications (
      user_id,
      kind,
      title,
      body,
      appointment_id,
      metadata
    ) VALUES (
      NEW.doctor_id,
      'appointment_booked',
      'New Appointment Booked',
      COALESCE(patient_name, 'A patient') || ' booked an appointment for ' || TO_CHAR(NEW.slot_time::TIMESTAMPTZ, 'Mon DD, YYYY at HH12:MI AM'),
      NEW.id,
      jsonb_build_object(
        'patient_id', NEW.patient_id,
        'patient_name', patient_name,
        'slot_time', NEW.slot_time,
        'appointment_id', NEW.id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new appointments
DROP TRIGGER IF EXISTS on_appointment_booked_notification ON appointments;
CREATE TRIGGER on_appointment_booked_notification
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION create_appointment_booked_notification();

-- Also create trigger for appointment status changes (cancellation)
CREATE OR REPLACE FUNCTION create_appointment_cancelled_notification()
RETURNS TRIGGER AS $$
DECLARE
  patient_name TEXT;
BEGIN
  -- Only proceed if status changed to cancelled
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Get patient name
    SELECT full_name INTO patient_name
    FROM profiles
    WHERE id = NEW.patient_id;

    -- Notify the other party
    IF NEW.cancelled_by = NEW.patient_id THEN
      -- Patient cancelled - notify doctor
      INSERT INTO app_notifications (
        user_id,
        kind,
        title,
        body,
        appointment_id,
        metadata
      ) VALUES (
        NEW.doctor_id,
        'appointment_cancelled',
        'Appointment Cancelled',
        COALESCE(patient_name, 'Patient') || ' cancelled the appointment scheduled for ' || TO_CHAR(NEW.slot_time::TIMESTAMPTZ, 'Mon DD, YYYY at HH12:MI AM'),
        NEW.id,
        jsonb_build_object(
          'patient_id', NEW.patient_id,
          'patient_name', patient_name,
          'slot_time', NEW.slot_time,
          'appointment_id', NEW.id,
          'cancelled_by', NEW.cancelled_by,
          'reason', NEW.cancellation_reason
        )
      );
    ELSE
      -- Doctor cancelled - notify patient  
      INSERT INTO app_notifications (
        user_id,
        kind,
        title,
        body,
        appointment_id,
        metadata
      ) VALUES (
        NEW.patient_id,
        'appointment_cancelled',
        'Appointment Cancelled',
        'Your appointment scheduled for ' || TO_CHAR(NEW.slot_time::TIMESTAMPTZ, 'Mon DD, YYYY at HH12:MI AM') || ' has been cancelled',
        NEW.id,
        jsonb_build_object(
          'patient_id', NEW.patient_id,
          'patient_name', patient_name,
          'slot_time', NEW.slot_time,
          'appointment_id', NEW.id,
          'cancelled_by', NEW.cancelled_by,
          'reason', NEW.cancellation_reason
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for appointment updates (cancellation)
DROP TRIGGER IF EXISTS on_appointment_cancelled_notification ON appointments;
CREATE TRIGGER on_appointment_cancelled_notification
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION create_appointment_cancelled_notification();
