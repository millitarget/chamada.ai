-- This script adds the anon policy to the rate_limits table if it doesn't exist already
DO $$
BEGIN
    -- Check if the policy already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'rate_limits' 
        AND policyname = 'Anon can insert and update rate limits'
    ) THEN
        -- Create the policy if it doesn't exist
        EXECUTE 'CREATE POLICY "Anon can insert and update rate limits" ON public.rate_limits FOR ALL TO anon USING (true) WITH CHECK (true)';
    END IF;
END
$$; 