-- Create import diagnostics tables
CREATE TABLE public.import_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  table_name TEXT NOT NULL,
  source_type TEXT NOT NULL, -- "csv-upload" | "google-sheets-url"
  source_url TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running', -- "running" | "succeeded" | "failed" | "partial"
  total_rows INTEGER,
  valid_rows INTEGER,
  upserted_rows INTEGER,
  skipped_rows INTEGER,
  error_summary TEXT,
  error_count INTEGER DEFAULT 0,
  warnings_count INTEGER DEFAULT 0,
  sample_json JSONB, -- JSON snapshot of normalized headers + first 20 rows for debugging
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.import_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID REFERENCES public.import_attempts(id) NOT NULL,
  row_number INTEGER,
  severity TEXT NOT NULL, -- "error" | "warning"
  code TEXT NOT NULL, -- e.g., "HEADER_MISSING", "DATE_PARSE", "UNIQUE_CONFLICT", "URL_FORBIDDEN", "RELATION_NOT_FOUND"
  message TEXT NOT NULL,
  raw_row_json JSONB,
  field TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.import_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_issues ENABLE ROW LEVEL SECURITY;

-- RLS policies for import_attempts
CREATE POLICY "Users can create their own import attempts" 
ON public.import_attempts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own import attempts" 
ON public.import_attempts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own import attempts" 
ON public.import_attempts 
FOR SELECT 
USING (auth.uid() = user_id);

-- RLS policies for import_issues
CREATE POLICY "Users can create issues for their own import attempts" 
ON public.import_issues 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.import_attempts 
  WHERE id = attempt_id AND user_id = auth.uid()
));

CREATE POLICY "Users can view issues for their own import attempts" 
ON public.import_issues 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.import_attempts 
  WHERE id = attempt_id AND user_id = auth.uid()
));

-- Add indexes for better performance
CREATE INDEX idx_import_attempts_user_id ON public.import_attempts(user_id);
CREATE INDEX idx_import_attempts_table_name ON public.import_attempts(table_name);
CREATE INDEX idx_import_attempts_status ON public.import_attempts(status);
CREATE INDEX idx_import_issues_attempt_id ON public.import_issues(attempt_id);
CREATE INDEX idx_import_issues_severity ON public.import_issues(severity);
CREATE INDEX idx_import_issues_code ON public.import_issues(code);

-- Add updated_at trigger
CREATE TRIGGER update_import_attempts_updated_at
  BEFORE UPDATE ON public.import_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();