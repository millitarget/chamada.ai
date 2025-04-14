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

1. Make sure your Supabase credentials are correct
2. Check that the rate_limits table was created successfully
3. Verify that the SQL migration ran without errors
4. Look for any console errors in the API route logs 