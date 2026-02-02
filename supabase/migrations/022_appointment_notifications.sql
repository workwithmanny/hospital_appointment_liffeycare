-- Enable realtime for appointment notifications
-- This allows doctors to receive realtime notifications when patients book appointments

-- Create appointment_notifications table to track notifications
CREATE TABLE IF NOT EXISTS appointment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'new_booking',
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_appointment_notifications_doctor_id 
  ON appointment_notifications(doctor_id);

CREATE INDEX IF NOT EXISTS idx_appointment_notifications_is_read 
  ON appointment_notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_appointment_notifications_created_at 
  ON appointment_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE appointment_notifications ENABLE ROW LEVEL SECURITY;

-- Doctors can only see their own notifications
CREATE POLICY "Doctors can view their own notifications"
  ON appointment_notifications
  FOR SELECT
  TO authenticated
  USING (doctor_id = auth.uid());

-- Only system can insert notifications (via triggers or API)
CREATE POLICY "System can insert notifications"
  ON appointment_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Doctors can update their own notifications (mark as read)
CREATE POLICY "Doctors can update their own notifications"
  ON appointment_notifications
  FOR UPDATE
  TO authenticated
  USING (doctor_id = auth.uid());

-- Add realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE appointment_notifications;

-- Create function to auto-create notification when appointment is booked
CREATE OR REPLACE FUNCTION create_appointment_notification()
RETURNS TRIGGER AS $$
DECLARE
  patient_name TEXT;
BEGIN
  -- Get patient name
  SELECT full_name INTO patient_name
  FROM profiles
  WHERE id = NEW.patient_id;

  -- Create notification for doctor
  INSERT INTO appointment_notifications (
    appointment_id,
    doctor_id,
    patient_id,
    type,
    message
  ) VALUES (
    NEW.id,
    NEW.doctor_id,
    NEW.patient_id,
    'new_booking',
    patient_name || ' booked an appointment for ' || TO_CHAR(NEW.slot_time::TIMESTAMPTZ, 'Mon DD, YYYY at HH:MI AM')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS on_appointment_booked ON appointments;
CREATE TRIGGER on_appointment_booked
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION create_appointment_notification();
