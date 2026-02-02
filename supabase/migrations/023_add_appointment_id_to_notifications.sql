-- Add appointment_id column to app_notifications table
-- This column links notifications to specific appointments

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'app_notifications' 
    AND column_name = 'appointment_id'
  ) THEN
    ALTER TABLE app_notifications 
    ADD COLUMN appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE;
    
    -- Create index for faster queries
    CREATE INDEX idx_app_notifications_appointment_id 
    ON app_notifications(appointment_id);
  END IF;
END $$;
