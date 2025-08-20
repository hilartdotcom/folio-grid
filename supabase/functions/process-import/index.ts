import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportRequest {
  importLogId: string;
  tableName: 'licenses' | 'companies' | 'contacts';
  csvData: string;
  fileName?: string;
}

interface ImportRow {
  [key: string]: any;
}

interface ImportResult {
  processed: number;
  imported: number;
  updated: number;
  failed: number;
  warnings: Array<{
    row: number;
    message: string;
    data: any;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { importLogId, tableName, csvData, fileName }: ImportRequest = await req.json();

    console.log(`Processing import for table: ${tableName}, import ID: ${importLogId}`);

    // Update import log status to processing
    await supabaseClient
      .from('import_logs')
      .update({ status: 'processing' })
      .eq('id', importLogId);

    // Parse CSV data
    const rows = parseCSV(csvData);
    if (rows.length === 0) {
      throw new Error('No data found in CSV file');
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    console.log(`Found ${dataRows.length} rows with headers: ${headers.join(', ')}`);

    const result: ImportResult = {
      processed: 0,
      imported: 0,
      updated: 0,
      failed: 0,
      warnings: []
    };

    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      const rowData = dataRows[i];
      const rowNumber = i + 2; // +2 because of header row and 0-indexing
      
      try {
        result.processed++;
        
        const processedRow = await processRow(tableName, headers, rowData, rowNumber, result.warnings);
        
        if (processedRow) {
          // Check if record exists for upsert logic
          const existingRecord = await findExistingRecord(supabaseClient, tableName, processedRow);
          
          if (existingRecord) {
            // Update existing record
            const { error } = await supabaseClient
              .from(tableName)
              .update(processedRow)
              .eq('id', existingRecord.id);
            
            if (error) throw error;
            result.updated++;
          } else {
            // Insert new record
            const { error } = await supabaseClient
              .from(tableName)
              .insert(processedRow);
            
            if (error) throw error;
            result.imported++;
          }
        }
      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        result.failed++;
        result.warnings.push({
          row: rowNumber,
          message: error.message || 'Unknown error',
          data: Object.fromEntries(headers.map((h, i) => [h, rowData[i]]))
        });
      }
    }

    // Update import log with final results
    await supabaseClient
      .from('import_logs')
      .update({
        status: 'completed',
        rows_processed: result.processed,
        rows_imported: result.imported,
        rows_updated: result.updated,
        rows_failed: result.failed,
        warnings: result.warnings,
        completed_at: new Date().toISOString()
      })
      .eq('id', importLogId);

    console.log('Import completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Import failed:', error);

    // Update import log with error
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.json && await req.json().then(data => data.importLogId).catch(() => null)) {
      await supabaseClient
        .from('import_logs')
        .update({
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', (await req.json()).importLogId);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function parseCSV(csvData: string): string[][] {
  const lines = csvData.split('\n').filter(line => line.trim());
  return lines.map(line => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result.map(cell => cell.replace(/^"|"$/g, ''));
  });
}

async function processRow(
  tableName: string,
  headers: string[],
  rowData: string[],
  rowNumber: number,
  warnings: Array<{ row: number; message: string; data: any }>
): Promise<ImportRow | null> {
  const row: ImportRow = {};
  
  // Map CSV headers to database columns based on table
  const columnMapping = getColumnMapping(tableName);
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].trim();
    const value = rowData[i]?.trim() || null;
    const dbColumn = columnMapping[header];
    
    if (dbColumn && value) {
      try {
        row[dbColumn] = processValue(dbColumn, value, tableName, rowNumber, warnings);
      } catch (error) {
        warnings.push({
          row: rowNumber,
          message: `Error processing column ${header}: ${error.message}`,
          data: { [header]: value }
        });
      }
    }
  }
  
  // Validate required fields
  const requiredFields = getRequiredFields(tableName);
  for (const field of requiredFields) {
    if (!row[field]) {
      warnings.push({
        row: rowNumber,
        message: `Missing required field: ${field}`,
        data: row
      });
      return null;
    }
  }
  
  return row;
}

function getColumnMapping(tableName: string): Record<string, string> {
  switch (tableName) {
    case 'licenses':
      return {
        'License Number': 'license_number',
        'License Type': 'license_type',
        'License Market': 'license_market',
        'License Category': 'license_category',
        'License Full Address': 'full_address',
        'License State': 'state',
        'License Country': 'country',
        'License Issue Date': 'issue_date',
        'License Expiration Date': 'expiration_date',
        'License Issued By': 'issued_by',
        'License Issued By Website': 'issued_by_website',
        'License Last Updated Date': 'last_updated'
      };
    case 'companies':
      return {
        'Company Name': 'name',
        'Company DBA': 'dba',
        'Company Website URL': 'website_url',
        'Company Linkedin URL': 'linkedin_url',
        'Open for Business?': 'open_for_business',
        'License Number': 'license_number',
        'Company Last Updated Date': 'company_last_updated'
      };
    case 'contacts':
      return {
        'Contact Unique ID': 'contact_unique_id',
        'Contact Full Name': 'full_name',
        'Contact First Name': 'first_name',
        'Contact Last Name': 'last_name',
        'Contact Job Category': 'job_category',
        'Contact Email': 'email',
        'Contact Phone Number': 'phone_number',
        'Contact Linkedin URL': 'linkedin_url',
        'License Number': 'license_number',
        'Contact Last Updated Date': 'contact_last_updated'
      };
    default:
      return {};
  }
}

function getRequiredFields(tableName: string): string[] {
  switch (tableName) {
    case 'licenses':
      return ['license_number'];
    case 'companies':
      return ['name'];
    case 'contacts':
      return ['first_name', 'last_name'];
    default:
      return [];
  }
}

function processValue(
  column: string,
  value: string,
  tableName: string,
  rowNumber: number,
  warnings: Array<{ row: number; message: string; data: any }>
): any {
  // Handle dates
  if (column.includes('date') || column.includes('_date')) {
    return parseDate(value, rowNumber, warnings);
  }
  
  // Handle booleans
  if (column === 'open_for_business') {
    return parseBoolean(value, rowNumber, warnings);
  }
  
  // Handle URLs
  if (column.includes('url') || column.includes('website')) {
    return parseURL(value, rowNumber, warnings);
  }
  
  // Handle state normalization
  if (column === 'state') {
    return normalizeState(value);
  }
  
  return value;
}

function parseDate(value: string, rowNumber: number, warnings: Array<{ row: number; message: string; data: any }>): string | null {
  if (!value) return null;
  
  try {
    // Parse MM/DD/YYYY format
    const parts = value.split('/');
    if (parts.length !== 3) throw new Error('Invalid date format');
    
    const month = parseInt(parts[0]);
    const day = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) {
      throw new Error('Invalid date values');
    }
    
    const date = new Date(year, month - 1, day);
    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
  } catch (error) {
    warnings.push({
      row: rowNumber,
      message: `Invalid date format: ${value}. Expected MM/DD/YYYY`,
      data: { value }
    });
    return null;
  }
}

function parseBoolean(value: string, rowNumber: number, warnings: Array<{ row: number; message: string; data: any }>): boolean | null {
  if (!value) return null;
  
  const normalized = value.toLowerCase();
  
  if (['true', 'yes', 'y', '1'].includes(normalized)) return true;
  if (['false', 'no', 'n', '0'].includes(normalized)) return false;
  
  warnings.push({
    row: rowNumber,
    message: `Invalid boolean value: ${value}. Expected true/false, yes/no, y/n, or 1/0`,
    data: { value }
  });
  
  return null;
}

function parseURL(value: string, rowNumber: number, warnings: Array<{ row: number; message: string; data: any }>): string | null {
  if (!value) return null;
  
  const trimmed = value.trim();
  
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    warnings.push({
      row: rowNumber,
      message: `Invalid URL format: ${value}. Must start with http:// or https://`,
      data: { value }
    });
    return null;
  }
  
  return trimmed;
}

function normalizeState(value: string): string {
  if (!value) return value;
  
  const stateMap: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY'
  };
  
  const normalized = stateMap[value.toLowerCase()];
  return normalized || value;
}

async function findExistingRecord(supabaseClient: any, tableName: string, row: ImportRow): Promise<any> {
  let query;
  
  switch (tableName) {
    case 'licenses':
      if (row.license_number) {
        const { data } = await supabaseClient
          .from(tableName)
          .select('id')
          .eq('license_number', row.license_number)
          .single();
        return data;
      }
      break;
    case 'companies':
      if (row.name && row.license_number) {
        const { data } = await supabaseClient
          .from(tableName)
          .select('id')
          .eq('name', row.name)
          .eq('license_number', row.license_number)
          .single();
        return data;
      } else if (row.name) {
        const { data } = await supabaseClient
          .from(tableName)
          .select('id')
          .eq('name', row.name)
          .single();
        return data;
      }
      break;
    case 'contacts':
      if (row.contact_unique_id) {
        const { data } = await supabaseClient
          .from(tableName)
          .select('id')
          .eq('contact_unique_id', row.contact_unique_id)
          .single();
        return data;
      } else if (row.first_name && row.last_name && row.license_number) {
        const { data } = await supabaseClient
          .from(tableName)
          .select('id')
          .eq('first_name', row.first_name)
          .eq('last_name', row.last_name)
          .eq('license_number', row.license_number)
          .single();
        return data;
      }
      break;
  }
  
  return null;
}