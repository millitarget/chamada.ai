# Rate Limiting Implementation

This document explains how to set up the IP-based rate limiting system for demo calls using Supabase.

## Overview

The system limits users to one demo call per hour based on their IP address. This prevents abuse of the ElevenLabs API and ensures fair usage of the demo feature.

## Requirements

- Supabase project
- NextJS application

## Setup Instructions

### 1. Create a Supabase Project

If you haven't already, create a new Supabase project at [https://supabase.com](https://supabase.com).

### 2. Set Up Environment Variables

Add your Supabase credentials to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

You can find these values in your Supabase project settings.

### 3. Create the Rate Limits Table

Run the SQL migration in the Supabase SQL editor:

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `supabase/migrations/20240101000000_create_rate_limits_table.sql`
5. Run the query

Alternatively, if you're using Supabase CLI for migrations, you can run:

```
supabase migration up
```

### 4. Testing Rate Limiting

To test the rate limiting:

1. Make a demo call with a valid phone number
2. Try to make another call within one hour - you should see a rate limit error
3. Wait one hour and try again - the call should go through

## How It Works

1. When a user requests a demo call, we extract their IP address from the request headers
2. We check the `rate_limits` table to see if this IP has made a call in the last hour
3. If they have, we return a 429 status code with information about when they can try again
4. If not, we process their call and update the table with their IP and the current timestamp

## Troubleshooting

If rate limiting isn't working:

### 1. Test Supabase Connection

Run the test endpoint by visiting `/api/test-supabase` in your browser. Check:
- If Supabase connection is working
- If the rate_limits table exists
- If test inserts work

### 2. Check Environment Variables

Make sure your `.env.local` file has the correct Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

You can find these in your Supabase dashboard under Project Settings > API.

### 3. Check SQL Errors

If you get SQL errors when running migrations:

**Error**: `policy already exists`
- This is because the policy with that name already exists
- Use the fix script in `supabase/fix_anon_policy.sql` which checks before creating

**Error**: `syntax error at or near "IF NOT EXISTS"`
- Some PostgreSQL versions in Supabase don't support `IF NOT EXISTS` for policies
- Use the DO block approach in the fix script

### 4. Create Table Manually

If all else fails, you can create the table manually:

1. Go to Supabase Dashboard > Table Editor
2. Click "Create a new table"
3. Set table name to "rate_limits"
4. Add columns:
   - id (uuid, primary key)
   - ip_address (text, unique)
   - last_call_time (int8)
   - created_at (timestamptz, default: now())
   - updated_at (timestamptz, default: now())
5. Create the table
6. Go to Authentication > Policies 
7. Add policies for both anon and service_role

### 5. Check Server Logs

The improved logging in the API route will show:
- If the connection to Supabase is working
- If IP address lookup is working
- If inserts/updates are successful

### 6. Check RLS Policies

If your table exists but you can't insert records, check Row Level Security policies:

1. Go to Authentication > Policies in Supabase
2. Make sure there's a policy for the "anon" role with INSERT and UPDATE permissions
3. If not, add it manually with:
   - Name: "Anon can insert and update rate limits"
   - Target roles: anon
   - Policy definition: all operations
   - Using expression: true
   - With check expression: true 