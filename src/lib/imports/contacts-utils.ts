import { ImportError } from '@/lib/errors';
import { supabase } from '@/integrations/supabase/client';

interface ValidationResult {
  totalRows: number;
  validRows: number;
  errorCount: number;
  warningsCount: number;
  headers: string[];
  normalizedHeaders: string[];
  issues: ImportIssue[];
  sampleData: any[];
}

interface ImportIssue {
  rowNumber?: number;
  severity: 'error' | 'warning';
  code: string;
  message: string;
  field?: string;
  rawRowData?: any;
}

// Header mapping configuration
const HEADER_ALIASES: Record<string, string[]> = {
  'Contact Unique ID': ['contact unique id', 'unique id', 'contact_id', 'contact id'],
  'Contact Full Name': ['contact full name', 'full name', 'name', 'full_name'],
  'Contact First Name': ['contact first name', 'first name', 'first_name', 'firstname'],
  'Contact Last Name': ['contact last name', 'last name', 'last_name', 'lastname'],
  'Contact Job Category': ['job category', 'contact job category', 'job_category'],
  'Contact Email': ['email', 'contact email', 'email_address'],
  'Contact Phone Number': ['phone', 'phone number', 'contact phone number', 'phone_number'],
  'Contact Linkedin URL': ['linkedin', 'linkedin url', 'contact linkedin url', 'linkedin_url'],
  'License Number': ['license number', 'license #', 'license', 'license_number'],
  'Contact Last Updated Date': ['last updated', 'contact last updated date', 'updated_date', 'last_updated']
};

const REQUIRED_HEADERS = ['Contact Unique ID'];

function normalizeHeader(header: string): string {
  // Remove BOM, trim, normalize whitespace and case
  return header
    .replace(/^\uFEFF/, '') // Remove BOM
    .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function mapHeaderToCanonical(header: string): string | null {
  const normalized = normalizeHeader(header);
  
  for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
    if (normalizeHeader(canonical) === normalized || aliases.some(alias => alias === normalized)) {
      return canonical;
    }
  }
  
  return null;
}

function transformGoogleSheetsUrl(url: string): string {
  // Convert Google Sheets edit URL to CSV export URL
  const editMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/edit.*gid=([0-9]+)/);
  if (editMatch) {
    const [, docId, gid] = editMatch;
    return `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv&gid=${gid}`;
  }
  
  const editMatchNoGid = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/edit/);
  if (editMatchNoGid) {
    const [, docId] = editMatchNoGid;
    return `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv&gid=0`;
  }
  
  return url;
}

function parseCSV(csvText: string): string[][] {
  // Simple CSV parser - handle quoted fields and newlines
  const rows: string[][] = [];
  const lines = csvText.split('\n');
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const row: string[] = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && (i === 0 || line[i-1] === ',')) {
        inQuotes = true;
      } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        row.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    row.push(currentField.trim());
    rows.push(row);
  }
  
  return rows;
}

function validateContactRow(rowData: any, rowNumber: number): ImportIssue[] {
  const issues: ImportIssue[] = [];
  
  // Required field validation
  if (!rowData['Contact Unique ID'] || rowData['Contact Unique ID'].toString().trim() === '') {
    issues.push({
      rowNumber,
      severity: 'error',
      code: 'UNIQUE_ID_MISSING',
      message: 'Contact Unique ID is required',
      field: 'Contact Unique ID',
      rawRowData: rowData
    });
  }
  
  // Email validation
  const email = rowData['Contact Email'];
  if (email && email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      issues.push({
        rowNumber,
        severity: 'warning',
        code: 'EMAIL_INVALID',
        message: 'Invalid email format',
        field: 'Contact Email',
        rawRowData: rowData
      });
    }
  }
  
  // URL validation
  const linkedinUrl = rowData['Contact Linkedin URL'];
  if (linkedinUrl && linkedinUrl.trim() !== '') {
    try {
      const url = new URL(linkedinUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      issues.push({
        rowNumber,
        severity: 'warning',
        code: 'URL_INVALID',
        message: 'LinkedIn URL must start with http:// or https://',
        field: 'Contact Linkedin URL',
        rawRowData: rowData
      });
    }
  }
  
  // Date validation
  const lastUpdated = rowData['Contact Last Updated Date'];
  if (lastUpdated && lastUpdated.trim() !== '') {
    const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    if (!dateRegex.test(lastUpdated)) {
      issues.push({
        rowNumber,
        severity: 'warning',
        code: 'DATE_PARSE',
        message: 'Date must be in MM/DD/YYYY format',
        field: 'Contact Last Updated Date',
        rawRowData: rowData
      });
    }
  }
  
  return issues;
}

export async function normalizeHeadersParseCsvBuffer(
  csvBuffer: Buffer, 
  options: { dryRun: boolean; correlationId: string }
): Promise<ValidationResult> {
  const { dryRun, correlationId } = options;
  
  // Clean CSV data
  let csvText = csvBuffer.toString('utf-8')
    .replace(/^\uFEFF/, '') // Remove BOM
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\u00A0/g, ' '); // Replace non-breaking spaces
  
  console.log('CSV_PARSE_START', { correlationId, csvLength: csvText.length });
  
  // Parse CSV
  const rows = parseCSV(csvText);
  if (rows.length === 0) {
    throw new ImportError('CSV_EMPTY', 'CSV file is empty or invalid');
  }
  
  const headers = rows[0];
  const dataRows = rows.slice(1);
  
  console.log('CSV_PARSED', { 
    correlationId, 
    totalRows: dataRows.length, 
    headers: headers.slice(0, 3) 
  });
  
  // Map headers to canonical names
  const headerMapping: Record<string, string> = {};
  const normalizedHeaders: string[] = [];
  const issues: ImportIssue[] = [];
  
  for (const header of headers) {
    const canonical = mapHeaderToCanonical(header);
    if (canonical) {
      headerMapping[header] = canonical;
      normalizedHeaders.push(canonical);
    } else {
      normalizedHeaders.push(header);
      issues.push({
        severity: 'warning',
        code: 'HEADER_UNKNOWN',
        message: `Unknown header: ${header}`,
        field: header
      });
    }
  }
  
  // Check for missing required headers
  for (const required of REQUIRED_HEADERS) {
    if (!normalizedHeaders.includes(required)) {
      issues.push({
        severity: 'error',
        code: 'HEADER_MISSING',
        message: `Required header missing: ${required}`,
        field: required
      });
    }
  }
  
  // Process data rows
  let validRows = 0;
  const sampleData: any[] = [];
  
  for (let i = 0; i < dataRows.length && i < 100; i++) {
    const row = dataRows[i];
    const rowData: any = {};
    
    // Map row data using header mapping
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      const canonical = headerMapping[header] || header;
      rowData[canonical] = row[j] || '';
    }
    
    // Validate row
    const rowIssues = validateContactRow(rowData, i + 2); // +2 for header + 1-based
    issues.push(...rowIssues);
    
    if (rowIssues.every(issue => issue.severity === 'warning')) {
      validRows++;
    }
    
    if (i < 20) {
      sampleData.push(rowData);
    }
  }
  
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningsCount = issues.filter(i => i.severity === 'warning').length;
  
  console.log('VALIDATION_COMPLETE', { 
    correlationId, 
    totalRows: dataRows.length, 
    validRows, 
    errorCount, 
    warningsCount 
  });
  
  return {
    totalRows: dataRows.length,
    validRows,
    errorCount,
    warningsCount,
    headers,
    normalizedHeaders,
    issues,
    sampleData
  };
}

export async function fetchGoogleSheetsAsCsv(url: string): Promise<Buffer> {
  const transformedUrl = transformGoogleSheetsUrl(url);
  
  console.log('GOOGLE_SHEETS_FETCH', { originalUrl: url, transformedUrl });
  
  const response = await fetch(transformedUrl, { 
    cache: 'no-store',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ImportBot/1.0)'
    }
  });
  
  if (!response.ok) {
    if (response.status === 403) {
      throw new ImportError(
        'URL_FORBIDDEN', 
        'Google Sheets URL is not accessible. Make the sheet public or use "Publish to web → CSV"', 
        403
      );
    }
    throw new ImportError('FETCH_FAILED', `URL returned ${response.status}`, response.status);
  }
  
  const contentType = response.headers.get('content-type') ?? '';
  if (!/text\/csv|application\/csv|text\/plain/.test(contentType)) {
    throw new ImportError(
      'UNSUPPORTED_CONTENT_TYPE', 
      `Expected CSV, got ${contentType}`, 
      415
    );
  }
  
  return Buffer.from(await response.arrayBuffer());
}