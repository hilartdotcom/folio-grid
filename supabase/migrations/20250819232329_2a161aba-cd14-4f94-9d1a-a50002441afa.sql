-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'analyst', 'viewer');
CREATE TYPE public.job_status AS ENUM ('queued', 'processing', 'done', 'error');
CREATE TYPE public.license_status AS ENUM ('active', 'trial', 'expired', 'suspended');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  role app_role NOT NULL DEFAULT 'viewer',
  theme TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  industry TEXT,
  size INTEGER,
  hq_country TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  country TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create licenses table
CREATE TABLE public.licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  license_key TEXT NOT NULL UNIQUE,
  product TEXT NOT NULL,
  status license_status NOT NULL DEFAULT 'active',
  seats INTEGER,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create export_jobs table
CREATE TABLE public.export_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  filters_json TEXT NOT NULL,
  status job_status NOT NULL DEFAULT 'queued',
  file_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create saved_views table
CREATE TABLE public.saved_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  config_json TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Companies, contacts, licenses - all authenticated users can view/edit based on role
CREATE POLICY "Authenticated users can view companies" ON public.companies
FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Analysts and admins can manage companies" ON public.companies
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('analyst', 'admin')
  )
);

CREATE POLICY "Authenticated users can view contacts" ON public.contacts
FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Analysts and admins can manage contacts" ON public.contacts
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('analyst', 'admin')
  )
);

CREATE POLICY "Authenticated users can view licenses" ON public.licenses
FOR SELECT TO authenticated USING (deleted_at IS NULL);

CREATE POLICY "Analysts and admins can manage licenses" ON public.licenses
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('analyst', 'admin')
  )
);

-- Export jobs - users can only see their own
CREATE POLICY "Users can view their own export jobs" ON public.export_jobs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own export jobs" ON public.export_jobs
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own export jobs" ON public.export_jobs
FOR UPDATE USING (auth.uid() = user_id);

-- Saved views - users can only see their own
CREATE POLICY "Users can view their own saved views" ON public.saved_views
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own saved views" ON public.saved_views
FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_companies_domain ON public.companies(domain) WHERE deleted_at IS NULL;
CREATE INDEX idx_companies_name ON public.companies(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_email ON public.contacts(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_company_id ON public.contacts(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_licenses_key ON public.licenses(license_key) WHERE deleted_at IS NULL;
CREATE INDEX idx_licenses_company_id ON public.licenses(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_licenses_end_date ON public.licenses(end_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_export_jobs_user_id ON public.export_jobs(user_id);
CREATE INDEX idx_saved_views_user_table ON public.saved_views(user_id, table_name);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_licenses_updated_at
BEFORE UPDATE ON public.licenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_export_jobs_updated_at
BEFORE UPDATE ON public.export_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_views_updated_at
BEFORE UPDATE ON public.saved_views
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
INSERT INTO public.profiles (user_id, name, role)
VALUES (NEW.id, NEW.raw_user_meta_data ->> 'name', 'viewer');
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();