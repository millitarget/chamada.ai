-- Create rate_limits table for IP-based rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address TEXT NOT NULL UNIQUE,
  last_call_time INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add RLS policies
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policies using DO block to check if they exist first
DO $$
BEGIN
    -- Check if service role policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'rate_limits' 
        AND policyname = 'Service role can manage rate_limits'
    ) THEN
        -- Create service role policy
        EXECUTE 'CREATE POLICY "Service role can manage rate_limits" ON public.rate_limits FOR ALL TO service_role USING (true)';
    END IF;

    -- Check if anon role policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'rate_limits' 
        AND policyname = 'Anon can insert and update rate limits'
    ) THEN
        -- Create anon role policy
        EXECUTE 'CREATE POLICY "Anon can insert and update rate limits" ON public.rate_limits FOR ALL TO anon USING (true) WITH CHECK (true)';
    END IF;
END
$$;

-- Create an index on ip_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_address ON public.rate_limits (ip_address);

-- Add a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function when rate_limits is updated
DROP TRIGGER IF EXISTS update_rate_limits_updated_at ON public.rate_limits;
CREATE TRIGGER update_rate_limits_updated_at
BEFORE UPDATE ON public.rate_limits
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 