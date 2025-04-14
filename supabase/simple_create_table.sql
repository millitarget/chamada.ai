-- Simple script to create rate_limits table

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT NOT NULL UNIQUE,
  last_call_time INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create a simple policy for anon access
DROP POLICY IF EXISTS "Anon can insert and update rate limits" ON public.rate_limits;
CREATE POLICY "Anon can insert and update rate limits" ON public.rate_limits FOR ALL TO anon USING (true) WITH CHECK (true);

-- Create a simple policy for service_role access
DROP POLICY IF EXISTS "Service role can manage rate_limits" ON public.rate_limits;
CREATE POLICY "Service role can manage rate_limits" ON public.rate_limits FOR ALL TO service_role USING (true);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_address ON public.rate_limits (ip_address); 