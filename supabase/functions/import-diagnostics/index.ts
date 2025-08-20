import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod-like validation (simplified for Deno)
interface ContactRow {
  contactUniqueId?: string;
  contactFullName?: string;
  contactFirstName?: string;
  contactLastName?: string;
  contactJobCategory?: string;
  contactEmail?: string;
  contactPhoneNumber?: string;
  contactLinkedinUrl?: string;
  licenseNumber?: string;
  contactLastUpdatedDate?: string;
}

interface ImportRequest {
  attemptId?: string;
  tableName: 'licenses' | 'companies' | 'contacts';
  csvData?: string;
  googleSheetsUrl?: string;
  dryRun?: boolean;
  fileName?: string;
}

interface ImportIssue {
  rowNumber?: number;
  severity: 'error' | 'warning';
  code: string;
  message: string;
  rawRowJson?: any;
  field?: string;
}

interface ImportResult {
  attemptId: string;
  status: 'running' | 'succeeded' | 'failed' | 'partial';
  totalRows: number;
  validRows: number;
  upsertedRows: number;
  skippedRows: number;
  errorCount: number;
  warningsCount: number;
  issues: ImportIssue[];
  sampleJson?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const correlationId = crypto.randomUUID();
  console.log(`[${correlationId}] Starting import request`);

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const request: ImportRequest = await req.json();
    console.log(`[${correlationId}] Request metadata:`, {
      tableName: request.tableName,
      dryRun: request.dryRun,
      hasGoogleSheetsUrl: !!request.googleSheetsUrl,
      fileName: request.fileName,
      csvDataLength: request.csvData?.length
    });

    let csvData = request.csvData;
    let effectiveUrl = '';

    // Handle Google Sheets URL transformation
    if (request.googleSheetsUrl) {
      const urlResult = await handleGoogleSheetsUrl(request.googleSheetsUrl, correlationId);
      if (urlResult.error) {
        return new Response(JSON.stringify({ 
          error: urlResult.error.message,
          code: urlResult.error.code 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      csvData = urlResult.csvData;
      effectiveUrl = urlResult.effectiveUrl;
    }

    if (!csvData) {
      throw new Error('No CSV data provided');
    }

    // Create import attempt
    const { data: user } = await supabaseClient.auth.getUser();
    const userId = user.user?.id;

    const { data: attempt, error: attemptError } = await supabaseClient
      .from('import_attempts')
      .insert({
        user_id: userId,
        table_name: request.tableName,
        source_type: request.googleSheetsUrl ? 'google-sheets-url' : 'csv-upload',
        source_url: effectiveUrl || null,
        status: 'running'
      })
      .select()
      .single();

    if (attemptError) throw attemptError;

    console.log(`[${correlationId}] Created import attempt: ${attempt.id}`);

    // Parse and validate CSV
    const result = await processImport(
      csvData,
      request.tableName,
      attempt.id,
      request.dryRun || false,
      supabaseClient,
      correlationId
    );

    // Update attempt with final results
    await supabaseClient
      .from('import_attempts')
      .update({
        finished_at: new Date().toISOString(),
        status: result.status,
        total_rows: result.totalRows,
        valid_rows: result.validRows,
        upserted_rows: result.upsertedRows,
        skipped_rows: result.skippedRows,
        error_count: result.errorCount,
        warnings_count: result.warningsCount,
        error_summary: result.issues.find(i => i.severity === 'error')?.message || null,
        sample_json: result.sampleJson
      })
      .eq('id', attempt.id);

    console.log(`[${correlationId}] Import completed:`, {
      status: result.status,
      totalRows: result.totalRows,
      validRows: result.validRows,
      errorCount: result.errorCount,
      warningsCount: result.warningsCount
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`[${correlationId}] Import failed:`, error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      correlationId 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleGoogleSheetsUrl(url: string, correlationId: string) {
  console.log(`[${correlationId}] Processing Google Sheets URL: ${url}`);

  // Transform edit URLs to export URLs
  let effectiveUrl = url;
  const editMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/edit/);
  
  if (editMatch) {
    const docId = editMatch[1];
    // Try to extract gid or default to 0
    const gidMatch = url.match(/gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    effectiveUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv&gid=${gid}`;
    console.log(`[${correlationId}] Transformed URL to: ${effectiveUrl}`);
  }

  // Validate URL with HEAD request
  try {
    const headResponse = await fetch(effectiveUrl, { method: 'HEAD' });
    const contentType = headResponse.headers.get('content-type');
    
    console.log(`[${correlationId}] HEAD request result:`, {
      status: headResponse.status,
      contentType
    });

    if (headResponse.status === 403 || headResponse.status === 404) {
      return {
        error: {
          code: 'URL_FORBIDDEN',
          message: 'Cannot access the Google Sheet. Make sure the sheet is public or use "Publish to web → CSV".'
        }
      };
    }

    if (!contentType?.includes('text/csv') && !contentType?.includes('text/plain')) {
      return {
        error: {
          code: 'UNSUPPORTED_FORMAT',
          message: `Expected CSV format but got ${contentType}. Make sure to use a CSV export URL.`
        }
      };
    }

    // Fetch the actual CSV data
    const response = await fetch(effectiveUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }

    let csvData = await response.text();
    
    // Clean up CSV data - remove BOM, normalize line endings, handle non-breaking spaces
    csvData = csvData.replace(/^\uFEFF/, ''); // Remove BOM
    csvData = csvData.replace(/\r\n/g, '\n').replace(/\r/g, '\n'); // Normalize line endings
    csvData = csvData.replace(/\u00A0/g, ' '); // Replace non-breaking spaces

    return { csvData, effectiveUrl };
    
  } catch (error) {
    console.error(`[${correlationId}] Error fetching Google Sheets:`, error);
    return {
      error: {
        code: 'FETCH_ERROR',
        message: `Failed to fetch Google Sheets data: ${error.message}`
      }
    };
  }
}

async function processImport(
  csvData: string,
  tableName: string,
  attemptId: string,
  dryRun: boolean,
  supabaseClient: any,
  correlationId: string
): Promise<ImportResult> {
  
  const issues: ImportIssue[] = [];
  
  try {
    // Parse CSV with resilient parsing
    const { headers, rows, sampleData } = parseCSVResilient(csvData, correlationId);
    
    if (rows.length === 0) {
      issues.push({
        severity: 'error',
        code: 'NO_DATA',
        message: 'No data rows found in CSV file'
      });
    }

    console.log(`[${correlationId}] Parsed CSV:`, {
      headerCount: headers.length,
      rowCount: rows.length,
      firstThreeHeaders: headers.slice(0, 3)
    });

    // Validate and normalize headers
    const headerMapping = validateHeaders(tableName, headers, issues);
    console.log(`[${correlationId}] Header mapping:`, Object.keys(headerMapping));

    let validRows = 0;
    let upsertedRows = 0;
    let skippedRows = 0;

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2; // +2 for header row and 1-indexing
      const rowData = rows[i];
      
      try {
        const processedRow = await processRow(
          tableName,
          headerMapping,
          rowData,
          rowNumber,
          issues,
          correlationId
        );

        if (processedRow && Object.keys(processedRow).length > 0) {
          validRows++;
          
          // Store issue in database
          await supabaseClient
            .from('import_issues')
            .insert(
              issues
                .filter(issue => issue.rowNumber === rowNumber)
                .map(issue => ({
                  attempt_id: attemptId,
                  row_number: issue.rowNumber,
                  severity: issue.severity,
                  code: issue.code,
                  message: issue.message,
                  raw_row_json: issue.rawRowJson,
                  field: issue.field
                }))
            );

          if (!dryRun) {
            // Check for existing record and upsert
            const existingRecord = await findExistingRecord(supabaseClient, tableName, processedRow);
            
            if (existingRecord) {
              const { error } = await supabaseClient
                .from(tableName)
                .update(processedRow)
                .eq('id', existingRecord.id);
              
              if (error) {
                issues.push({
                  rowNumber,
                  severity: 'error',
                  code: 'UPDATE_ERROR',
                  message: error.message,
                  rawRowJson: Object.fromEntries(headers.map((h, j) => [h, rowData[j]]))
                });
                skippedRows++;
              } else {
                upsertedRows++;
              }
            } else {
              const { error } = await supabaseClient
                .from(tableName)
                .insert(processedRow);
              
              if (error) {
                issues.push({
                  rowNumber,
                  severity: 'error',
                  code: 'INSERT_ERROR',
                  message: error.message,
                  rawRowJson: Object.fromEntries(headers.map((h, j) => [h, rowData[j]]))
                });
                skippedRows++;
              } else {
                upsertedRows++;
              }
            }
          }
        } else {
          skippedRows++;
        }
      } catch (error) {
        console.error(`[${correlationId}] Error processing row ${rowNumber}:`, error);
        issues.push({
          rowNumber,
          severity: 'error',
          code: 'ROW_PROCESSING_ERROR',
          message: error.message,
          rawRowJson: Object.fromEntries(headers.map((h, j) => [h, rowData[j]]))
        });
        skippedRows++;
      }
    }

    // Developer checks
    logDeveloperChecks(headers, rows, tableName, correlationId, supabaseClient);

    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningsCount = issues.filter(i => i.severity === 'warning').length;

    let status: 'succeeded' | 'failed' | 'partial' = 'succeeded';
    if (errorCount > 0 && upsertedRows === 0) {
      status = 'failed';
    } else if (errorCount > 0) {
      status = 'partial';
    }

    return {
      attemptId,
      status,
      totalRows: rows.length,
      validRows,
      upsertedRows,
      skippedRows,
      errorCount,
      warningsCount,
      issues: issues.slice(0, 100), // Limit issues returned to first 100
      sampleJson: sampleData
    };

  } catch (error) {
    console.error(`[${correlationId}] Critical error in processImport:`, error);
    issues.push({
      severity: 'error',
      code: 'CRITICAL_ERROR',
      message: error.message
    });

    return {
      attemptId,
      status: 'failed',
      totalRows: 0,
      validRows: 0,
      upsertedRows: 0,
      skippedRows: 0,
      errorCount: issues.length,
      warningsCount: 0,
      issues
    };
  }
}

function parseCSVResilient(csvData: string, correlationId: string) {
  console.log(`[${correlationId}] Starting CSV parsing`);
  
  const lines = csvData.split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    throw new Error('Empty CSV file');
  }

  // Auto-detect delimiter
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';
  
  console.log(`[${correlationId}] Detected delimiter: ${delimiter}`);

  const parseCSVLine = (line: string, maxSize = 1024 * 1024): string[] => {
    if (line.length > maxSize) {
      throw new Error(`ROW_TOO_LARGE: Row exceeds ${maxSize} bytes`);
    }

    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result.map(cell => cell.replace(/^"|"$/g, ''));
  };

  const headers = parseCSVLine(lines[0]).map(h => normalizeHeader(h));
  const rows = [];
  const sampleData = { headers, rows: [] as string[][] };

  for (let i = 1; i < lines.length; i++) {
    try {
      const row = parseCSVLine(lines[i]);
      rows.push(row);
      
      // Collect first 20 rows for sample
      if (i <= 20) {
        sampleData.rows.push(row);
      }
    } catch (error) {
      console.warn(`[${correlationId}] Skipping malformed row ${i + 1}: ${error.message}`);
    }
  }

  console.log(`[${correlationId}] CSV parsing complete:`, {
    totalLines: lines.length,
    headerCount: headers.length,
    validRows: rows.length,
    sampleRowsCollected: sampleData.rows.length
  });

  return { headers, rows, sampleData };
}

function normalizeHeader(header: string): string {
  return header
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

function validateHeaders(tableName: string, headers: string[], issues: ImportIssue[]) {
  const headerMapping: Record<string, string> = {};
  
  // Header alias mapping for contacts
  const contactAliases: Record<string, string[]> = {
    'Contact Unique ID': ['contact unique id', 'unique id', 'contact_id', 'contact id'],
    'Contact Full Name': ['contact full name', 'full name', 'name'],
    'Contact First Name': ['contact first name', 'first name', 'firstname'],
    'Contact Last Name': ['contact last name', 'last name', 'lastname'],
    'Contact Job Category': ['job category', 'contact job category', 'category'],
    'Contact Email': ['email', 'contact email', 'e-mail'],
    'Contact Phone Number': ['phone', 'phone number', 'contact phone number', 'telephone'],
    'Contact Linkedin URL': ['linkedin', 'linkedin url', 'contact linkedin url', 'linkedin profile'],
    'License Number': ['license number', 'license #', 'license', 'license_number'],
    'Contact Last Updated Date': ['last updated', 'contact last updated date', 'updated date']
  };

  // Create reverse mapping for case-insensitive lookup
  const aliasLookup: Record<string, string> = {};
  for (const [canonical, aliases] of Object.entries(contactAliases)) {
    aliasLookup[canonical.toLowerCase()] = canonical;
    for (const alias of aliases) {
      aliasLookup[alias.toLowerCase()] = canonical;
    }
  }

  // Map headers to canonical names
  for (const header of headers) {
    const normalizedHeader = header.toLowerCase().trim();
    const canonical = aliasLookup[normalizedHeader];
    if (canonical) {
      headerMapping[header] = canonical;
    }
  }

  // Check for missing required headers
  const requiredHeaders = ['Contact Unique ID', 'Contact First Name', 'Contact Last Name'];
  for (const required of requiredHeaders) {
    const found = Object.values(headerMapping).includes(required);
    if (!found) {
      issues.push({
        severity: 'error',
        code: 'HEADER_MISSING',
        message: `Missing required header: ${required}`,
        field: required
      });
    }
  }

  return headerMapping;
}

async function processRow(
  tableName: string,
  headerMapping: Record<string, string>,
  rowData: string[],
  rowNumber: number,
  issues: ImportIssue[],
  correlationId: string
): Promise<Record<string, any> | null> {
  
  const row: Record<string, any> = {};
  const rawRowJson: Record<string, any> = {};

  // Map row data using header mapping
  const headers = Object.keys(headerMapping);
  for (let i = 0; i < headers.length && i < rowData.length; i++) {
    const originalHeader = headers[i];
    const canonicalHeader = headerMapping[originalHeader];
    const value = rowData[i]?.trim() || '';
    
    rawRowJson[originalHeader] = value;
    
    if (canonicalHeader && value) {
      try {
        row[getDbColumn(canonicalHeader)] = processValue(canonicalHeader, value, rowNumber, issues);
      } catch (error) {
        issues.push({
          rowNumber,
          severity: 'warning',
          code: 'VALUE_PROCESSING_ERROR',
          message: `Error processing ${canonicalHeader}: ${error.message}`,
          field: canonicalHeader,
          rawRowJson
        });
      }
    }
  }

  // Validate required fields
  if (!row.contact_unique_id && !row.first_name && !row.last_name) {
    // Try to generate surrogate ID
    if (row.first_name && row.last_name && row.license_number) {
      const hash = await generateHash(`${row.first_name}-${row.last_name}-${row.license_number}`);
      row.contact_unique_id = `CNT-${hash.substring(0, 8)}`;
      issues.push({
        rowNumber,
        severity: 'warning',
        code: 'UNIQUE_ID_GENERATED',
        message: `Generated surrogate Contact Unique ID: ${row.contact_unique_id}`,
        rawRowJson
      });
    } else {
      issues.push({
        rowNumber,
        severity: 'error',
        code: 'UNIQUE_ID_MISSING',
        message: 'Missing Contact Unique ID and insufficient data to generate one',
        rawRowJson
      });
      return null;
    }
  }

  if (!row.first_name) {
    issues.push({
      rowNumber,
      severity: 'error',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'Missing required field: first_name',
      field: 'first_name',
      rawRowJson
    });
    return null;
  }

  if (!row.last_name) {
    issues.push({
      rowNumber,
      severity: 'error',
      code: 'MISSING_REQUIRED_FIELD',
      message: 'Missing required field: last_name',
      field: 'last_name',
      rawRowJson
    });
    return null;
  }

  return row;
}

function getDbColumn(canonicalHeader: string): string {
  const mapping: Record<string, string> = {
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
  return mapping[canonicalHeader] || canonicalHeader.toLowerCase().replace(/\s+/g, '_');
}

function processValue(canonicalHeader: string, value: string, rowNumber: number, issues: ImportIssue[]): any {
  // Process dates
  if (canonicalHeader === 'Contact Last Updated Date') {
    return parseDate(value, rowNumber, issues);
  }
  
  // Process URLs
  if (canonicalHeader === 'Contact Linkedin URL') {
    return parseURL(value, rowNumber, issues);
  }
  
  // Process email
  if (canonicalHeader === 'Contact Email') {
    if (value && !value.includes('@')) {
      issues.push({
        rowNumber,
        severity: 'warning',
        code: 'EMAIL_INVALID',
        message: `Invalid email format: ${value}`,
        field: 'email'
      });
      return null;
    }
    return value || null;
  }
  
  // Process phone
  if (canonicalHeader === 'Contact Phone Number') {
    const cleaned = value.replace(/\s+/g, ' ').trim();
    if (cleaned && cleaned.length < 7) {
      issues.push({
        rowNumber,
        severity: 'warning',
        code: 'PHONE_SHORT',
        message: `Phone number seems too short: ${cleaned}`,
        field: 'phone_number'
      });
    }
    return cleaned || null;
  }
  
  return value;
}

function parseDate(value: string, rowNumber: number, issues: ImportIssue[]): string | null {
  if (!value) return null;
  
  // Parse MM/DD/YYYY format strictly
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) {
    issues.push({
      rowNumber,
      severity: 'warning',
      code: 'DATE_PARSE',
      message: `Invalid date format: ${value}. Expected MM/DD/YYYY`,
      field: 'contact_last_updated'
    });
    return null;
  }
  
  const month = parseInt(match[1]);
  const day = parseInt(match[2]);
  const year = parseInt(match[3]);
  
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) {
    issues.push({
      rowNumber,
      severity: 'warning',
      code: 'DATE_PARSE',
      message: `Invalid date values: ${value}`,
      field: 'contact_last_updated'
    });
    return null;
  }
  
  const date = new Date(year, month - 1, day);
  return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
}

function parseURL(value: string, rowNumber: number, issues: ImportIssue[]): string | null {
  if (!value) return null;
  
  const trimmed = value.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    issues.push({
      rowNumber,
      severity: 'warning',
      code: 'URL_INVALID',
      message: `Invalid URL format: ${value}. Must start with http:// or https://`,
      field: 'linkedin_url'
    });
    return null;
  }
  
  return trimmed;
}

async function generateHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function findExistingRecord(supabaseClient: any, tableName: string, row: Record<string, any>): Promise<any> {
  if (tableName === 'contacts') {
    if (row.contact_unique_id) {
      const { data } = await supabaseClient
        .from(tableName)
        .select('id')
        .eq('contact_unique_id', row.contact_unique_id)
        .maybeSingle();
      return data;
    } else if (row.first_name && row.last_name && row.license_number) {
      const { data } = await supabaseClient
        .from(tableName)
        .select('id')
        .eq('first_name', row.first_name)
        .eq('last_name', row.last_name)
        .eq('license_number', row.license_number)
        .maybeSingle();
      return data;
    }
  }
  return null;
}

async function logDeveloperChecks(
  headers: string[],
  rows: string[][],
  tableName: string,
  correlationId: string,
  supabaseClient: any
) {
  console.log(`[${correlationId}] Developer checks:`);
  console.log(`- Normalized headers (first 3): ${headers.slice(0, 3).join(', ')}`);
  console.log(`- Total rows parsed: ${rows.length}`);
  
  // Check for Contact Unique ID coverage
  const uniqueIdColumn = headers.findIndex(h => h.toLowerCase().includes('unique id'));
  if (uniqueIdColumn >= 0) {
    const nonEmptyIds = rows.filter(row => row[uniqueIdColumn]?.trim()).length;
    console.log(`- Rows with Contact Unique ID: ${nonEmptyIds}/${rows.length} (${(nonEmptyIds/rows.length*100).toFixed(1)}%)`);
  }
  
  // Check license numbers
  const licenseColumn = headers.findIndex(h => h.toLowerCase().includes('license'));
  if (licenseColumn >= 0) {
    const licenseNumbers = rows
      .map(row => row[licenseColumn]?.trim())
      .filter(Boolean)
      .slice(0, 10);
    console.log(`- Top 10 license numbers: ${licenseNumbers.join(', ')}`);
    
    // Check how many exist in the licenses table
    if (licenseNumbers.length > 0) {
      const { data: existingLicenses } = await supabaseClient
        .from('licenses')
        .select('license_number')
        .in('license_number', licenseNumbers);
      
      console.log(`- Existing licenses found: ${existingLicenses?.length || 0}/${licenseNumbers.length}`);
    }
  }
  
  // Example date parse check
  const dateColumn = headers.findIndex(h => h.toLowerCase().includes('date'));
  if (dateColumn >= 0) {
    const firstDate = rows.find(row => row[dateColumn]?.trim())?.[dateColumn];
    if (firstDate) {
      console.log(`- Example date parsing: "${firstDate}" -> ${parseDate(firstDate, 0, [])}`);
    }
  }
}