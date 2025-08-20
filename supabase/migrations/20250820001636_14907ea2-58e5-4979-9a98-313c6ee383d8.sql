-- Update licenses table to match Google Sheets schema
ALTER TABLE public.licenses DROP COLUMN IF EXISTS product;
ALTER TABLE public.licenses DROP COLUMN IF EXISTS license_key;
ALTER TABLE public.licenses DROP COLUMN IF EXISTS seats;
ALTER TABLE public.licenses DROP COLUMN IF EXISTS start_date;
ALTER TABLE public.licenses DROP COLUMN IF EXISTS end_date;
ALTER TABLE public.licenses DROP COLUMN IF EXISTS notes;
ALTER TABLE public.licenses DROP COLUMN IF EXISTS status;
ALTER TABLE public.licenses DROP COLUMN IF EXISTS company_id;

-- Add new columns for dispensary license schema
ALTER TABLE public.licenses ADD COLUMN license_number TEXT UNIQUE;
ALTER TABLE public.licenses ADD COLUMN license_type TEXT;
ALTER TABLE public.licenses ADD COLUMN license_market TEXT;
ALTER TABLE public.licenses ADD COLUMN license_category TEXT;
ALTER TABLE public.licenses ADD COLUMN full_address TEXT;
ALTER TABLE public.licenses ADD COLUMN state TEXT;
ALTER TABLE public.licenses ADD COLUMN country TEXT;
ALTER TABLE public.licenses ADD COLUMN issue_date DATE;
ALTER TABLE public.licenses ADD COLUMN expiration_date DATE;
ALTER TABLE public.licenses ADD COLUMN issued_by TEXT;
ALTER TABLE public.licenses ADD COLUMN issued_by_website TEXT;
ALTER TABLE public.licenses ADD COLUMN last_updated DATE;

-- Update companies table to match Google Sheets schema
ALTER TABLE public.companies DROP COLUMN IF EXISTS industry;
ALTER TABLE public.companies DROP COLUMN IF EXISTS domain;
ALTER TABLE public.companies DROP COLUMN IF EXISTS size;
ALTER TABLE public.companies DROP COLUMN IF EXISTS hq_country;

-- Add new columns for company schema
ALTER TABLE public.companies ADD COLUMN dba TEXT;
ALTER TABLE public.companies ADD COLUMN website_url TEXT;
ALTER TABLE public.companies ADD COLUMN linkedin_url TEXT;
ALTER TABLE public.companies ADD COLUMN open_for_business BOOLEAN;
ALTER TABLE public.companies ADD COLUMN license_number TEXT;
ALTER TABLE public.companies ADD COLUMN company_last_updated DATE;

-- Update contacts table to match Google Sheets schema
ALTER TABLE public.contacts DROP COLUMN IF EXISTS title;
ALTER TABLE public.contacts DROP COLUMN IF EXISTS phone;
ALTER TABLE public.contacts DROP COLUMN IF EXISTS country;
ALTER TABLE public.contacts DROP COLUMN IF EXISTS company_id;

-- Add new columns for contact schema
ALTER TABLE public.contacts ADD COLUMN contact_unique_id TEXT UNIQUE;
ALTER TABLE public.contacts ADD COLUMN full_name TEXT;
ALTER TABLE public.contacts ADD COLUMN job_category TEXT;
ALTER TABLE public.contacts ADD COLUMN phone_number TEXT;
ALTER TABLE public.contacts ADD COLUMN linkedin_url TEXT;
ALTER TABLE public.contacts ADD COLUMN license_number TEXT;
ALTER TABLE public.contacts ADD COLUMN contact_last_updated DATE;

-- Create foreign key relationships via license_number
ALTER TABLE public.companies ADD CONSTRAINT companies_license_number_fkey 
  FOREIGN KEY (license_number) REFERENCES public.licenses(license_number);

ALTER TABLE public.contacts ADD CONSTRAINT contacts_license_number_fkey 
  FOREIGN KEY (license_number) REFERENCES public.licenses(license_number);

-- Create indexes for search and performance
CREATE INDEX IF NOT EXISTS idx_licenses_search ON public.licenses USING GIN (
  to_tsvector('english', 
    COALESCE(license_number, '') || ' ' ||
    COALESCE(license_type, '') || ' ' ||
    COALESCE(license_market, '') || ' ' ||
    COALESCE(license_category, '') || ' ' ||
    COALESCE(full_address, '') || ' ' ||
    COALESCE(state, '') || ' ' ||
    COALESCE(country, '') || ' ' ||
    COALESCE(issued_by, '')
  )
);

CREATE INDEX IF NOT EXISTS idx_companies_search ON public.companies USING GIN (
  to_tsvector('english', 
    COALESCE(name, '') || ' ' ||
    COALESCE(dba, '') || ' ' ||
    COALESCE(license_number, '')
  )
);

CREATE INDEX IF NOT EXISTS idx_contacts_search ON public.contacts USING GIN (
  to_tsvector('english', 
    COALESCE(first_name, '') || ' ' ||
    COALESCE(last_name, '') || ' ' ||
    COALESCE(full_name, '') || ' ' ||
    COALESCE(license_number, '')
  )
);

-- Add B-tree indexes for date sorting
CREATE INDEX IF NOT EXISTS idx_licenses_last_updated ON public.licenses(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_companies_last_updated ON public.companies(company_last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_last_updated ON public.contacts(contact_last_updated DESC);

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS idx_licenses_state ON public.licenses(state);
CREATE INDEX IF NOT EXISTS idx_licenses_country ON public.licenses(country);
CREATE INDEX IF NOT EXISTS idx_licenses_market ON public.licenses(license_market);
CREATE INDEX IF NOT EXISTS idx_licenses_category ON public.licenses(license_category);
CREATE INDEX IF NOT EXISTS idx_companies_open ON public.companies(open_for_business);
CREATE INDEX IF NOT EXISTS idx_contacts_job_category ON public.contacts(job_category);

-- Create import audit table
CREATE TABLE public.import_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  import_type TEXT NOT NULL, -- 'csv_upload' or 'google_sheets'
  file_name TEXT,
  source_url TEXT,
  rows_processed INTEGER NOT NULL DEFAULT 0,
  rows_imported INTEGER NOT NULL DEFAULT 0,
  rows_updated INTEGER NOT NULL DEFAULT 0,
  rows_failed INTEGER NOT NULL DEFAULT 0,
  warnings JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on import_logs
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for import_logs
CREATE POLICY "Users can view their own import logs" 
ON public.import_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own import logs" 
ON public.import_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own import logs" 
ON public.import_logs 
FOR UPDATE 
USING (auth.uid() = user_id);