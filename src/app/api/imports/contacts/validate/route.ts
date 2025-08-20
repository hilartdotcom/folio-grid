import { jsonOk, jsonErr, ImportError } from '@/lib/errors';
import { normalizeHeadersParseCsvBuffer, fetchGoogleSheetsAsCsv } from '@/lib/imports/contacts-utils';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const preferredRegion = 'iad1';
export const maxDuration = 60;

export async function POST(req: Request) {
  const correlationId = crypto.randomUUID();
  
  try {
    // Get auth user (optional for validation)
    const authHeader = req.headers.get('authorization');
    let user = null;
    
    if (authHeader) {
      const supabase = createClient(
        'https://awdwtzawimyiavcsaddu.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZHd0emF3aW15aWF2Y3NhZGR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDI3OTUsImV4cCI6MjA3MTIxODc5NX0.JboQMlWHLFVioBCNGbSC27lh-eOleYOs_atdt0X2z8k',
        {
          global: {
            headers: {
              Authorization: authHeader
            }
          }
        }
      );

      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;
    }

    const contentType = req.headers.get('content-type') ?? '';
    let csvBuffer: Buffer;
    let fileName: string | undefined;

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file') as File | null;
      if (!file) {
        throw new ImportError('FILE_MISSING', 'No CSV file uploaded');
      }
      fileName = file.name;
      csvBuffer = Buffer.from(await file.arrayBuffer());
    } else {
      const body = await req.json().catch(() => ({}));
      const url = body?.googleSheetsUrl as string | undefined;
      fileName = body?.fileName;
      
      if (!url) {
        throw new ImportError('URL_MISSING', 'No Google Sheets/CSV URL provided');
      }
      
      csvBuffer = await fetchGoogleSheetsAsCsv(url);
    }

    // Check file size (10MB limit)
    if (csvBuffer.length > 10 * 1024 * 1024) {
      throw new ImportError('PAYLOAD_TOO_LARGE', 'CSV file too large (max 10MB)', 413);
    }

    console.log('CONTACTS_VALIDATE_START', { 
      correlationId, 
      fileName, 
      csvSize: csvBuffer.length,
      userId: user?.id 
    });

    // Parse and validate (dry-run)
    const result = await normalizeHeadersParseCsvBuffer(csvBuffer, { 
      dryRun: true, 
      correlationId 
    });

    console.log('CONTACTS_VALIDATE_SUCCESS', { 
      correlationId, 
      ...result 
    });

    return jsonOk({ 
      ok: true, 
      correlationId, 
      ...result 
    });

  } catch (e: any) {
    const code = e?.code ?? 'UNHANDLED';
    const message = e?.message ?? 'Unknown error';
    const status = e?.status ?? 500;
    
    console.error('CONTACTS_VALIDATE_ERROR', { 
      correlationId, 
      code, 
      message, 
      stack: e?.stack 
    });
    
    return jsonErr(code, message, correlationId, status);
  }
}