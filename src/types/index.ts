export interface License {
  id: string;
  license_number?: string;
  license_type?: string;
  license_market?: string;
  license_category?: string;
  full_address?: string;
  state?: string;
  country?: string;
  issue_date?: string;
  expiration_date?: string;
  issued_by?: string;
  issued_by_website?: string;
  last_updated?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  tags?: string[];
}

export interface Company {
  id: string;
  name: string;
  dba?: string;
  website_url?: string;
  linkedin_url?: string;
  open_for_business?: boolean;
  license_number?: string;
  company_last_updated?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  tags?: string[];
  license?: License;
}

export interface Contact {
  id: string;
  contact_unique_id?: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  job_category?: string;
  email?: string;
  phone_number?: string;
  linkedin_url?: string;
  license_number?: string;
  contact_last_updated?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  tags?: string[];
  license?: License;
  company?: Company;
}

export interface ImportLog {
  id: string;
  user_id: string;
  table_name: string;
  import_type: 'csv_upload' | 'google_sheets';
  file_name?: string;
  source_url?: string;
  rows_processed: number;
  rows_imported: number;
  rows_updated: number;
  rows_failed: number;
  warnings: any[];
  status: 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface TableFilter {
  id: string;
  operator: 'equals' | 'contains' | 'in' | 'between' | 'gte' | 'lte' | 'isSet';
  value: any;
}

export interface TableSort {
  id: string;
  desc: boolean;
}

export interface TableColumn {
  id: string;
  visible: boolean;
  order: number;
  pinned?: 'left' | 'right' | null;
}

export interface TableState {
  page: number;
  pageSize: number;
  sort: TableSort[];
  globalSearch: string;
  filters: TableFilter[];
  columns: TableColumn[];
}

export interface KPIData {
  totalLicenses: number;
  totalCompanies: number;
  totalContacts: number;
  totalStates: number;
}

export interface ExportJob {
  id: string;
  user_id: string;
  table_name: string;
  filters_json: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  file_url?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}