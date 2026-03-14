
-- Fix: Remove overly permissive anon insert policy and replace with device_id-based check
DROP POLICY "Anon can insert sensor data" ON public.sensor_readings;
CREATE POLICY "Anon can insert sensor data with device_id" ON public.sensor_readings FOR INSERT TO anon WITH CHECK (device_id IS NOT NULL AND device_id <> '');
