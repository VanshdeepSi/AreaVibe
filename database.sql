-- Run this in the Supabase SQL Editor

-- 1. Create a table for crowdsourced ratings
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    location_name TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    noise_score INTEGER NOT NULL CHECK (noise_score >= 1 AND noise_score <= 5),
    air_score INTEGER NOT NULL CHECK (air_score >= 1 AND air_score <= 5),
    water_score INTEGER NOT NULL CHECK (water_score >= 1 AND water_score <= 5),
    safety_score INTEGER NOT NULL CHECK (safety_score >= 1 AND safety_score <= 5),
    note TEXT,
    -- We can round lat/lon to 3 decimal places to group ratings by approximate ~100m areas
    location_hash TEXT GENERATED ALWAYS AS (
      location_name || '_' || ROUND(lat::numeric, 3)::text || '_' || ROUND(lon::numeric, 3)::text
    ) STORED
);

-- 2. Set up Row Level Security (RLS)
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read ratings
CREATE POLICY "Allow public read access on ratings" 
ON public.ratings 
FOR SELECT 
USING (true);

-- Allow authenticated users to insert their own ratings
CREATE POLICY "Allow authenticated users to insert ratings" 
ON public.ratings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Create a view or function to get average ratings for a location area
CREATE OR REPLACE FUNCTION get_location_averages(p_lat DOUBLE PRECISION, p_lon DOUBLE PRECISION)
RETURNS TABLE (
    avg_noise DOUBLE PRECISION,
    avg_air DOUBLE PRECISION,
    avg_water DOUBLE PRECISION,
    avg_safety DOUBLE PRECISION,
    rating_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    AVG(noise_score)::DOUBLE PRECISION,
    AVG(air_score)::DOUBLE PRECISION,
    AVG(water_score)::DOUBLE PRECISION,
    AVG(safety_score)::DOUBLE PRECISION,
    COUNT(*)
  FROM public.ratings
  -- Match ratings within roughly ~1km radius (approx 0.01 degrees)
  WHERE lat BETWEEN p_lat - 0.01 AND p_lat + 0.01
    AND lon BETWEEN p_lon - 0.01 AND p_lon + 0.01;
END;
$$ LANGUAGE plpgsql;
