
-- User alerts table (per-user, generated from sensor danger conditions)
CREATE TABLE public.user_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'warning',
  crop TEXT,
  zone TEXT,
  title TEXT NOT NULL,
  msg TEXT NOT NULL,
  action TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts" ON public.user_alerts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts" ON public.user_alerts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON public.user_alerts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts" ON public.user_alerts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- User crops table
CREATE TABLE public.user_crops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  crop_name TEXT NOT NULL,
  zone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_crops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own crops" ON public.user_crops
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own crops" ON public.user_crops
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own crops" ON public.user_crops
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own crops" ON public.user_crops
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
