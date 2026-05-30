-- Create table for storing patient details and knee osteoarthritis predictions
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    height NUMERIC NOT NULL,
    weight NUMERIC NOT NULL,
    bmi NUMERIC NOT NULL,
    swollen_muscles BOOLEAN NOT NULL DEFAULT false,
    heart_bypass BOOLEAN NOT NULL DEFAULT false,
    womac_score INTEGER NOT NULL,
    symptom_years INTEGER NOT NULL,
    kl_grade INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to insert records (in development)
CREATE POLICY "Allow public inserts" ON public.predictions
    FOR INSERT WITH CHECK (true);

-- Policy to allow anyone to read records (in development)
CREATE POLICY "Allow public selects" ON public.predictions
    FOR SELECT USING (true);
