import { jsonOk, jsonErr, ImportError } from '@/lib/errors';
import { normalizeHeadersParseCsvBuffer, fetchGoogleSheetsAsCsv } from '@/lib/imports/contacts-utils';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const preferredRegion = 'iad1';
export const maxDuration = 60;

type Action = 'validate' | 'commit' | 'health';

export async function GET(_: Request, { params }: { params: { action: string } }) {
  const action = (params.action ?? '').toLowerCase() as Action;
  if (action !== 'health') {
    return jsonErr('METHOD_NOT_ALLOWED', 'Use POST for this endpoint. Try /health to test.', crypto.randomUUID(), 405);
  }
  return jsonOk({ ok: true, message: 'contacts import endpoint alive', timestamp: new Date().toISOString() });
}

export async function POST(req: Request, { params }: { params: { action: string } }) {
  const correlationId = crypto.randomUUID();
  
  try {
    const action = (params.action ?? '').toLowerCase() as Action;
    if (!['validate', 'commit'].includes(action)) {
      throw new ImportError('NOT_FOUND', `Unknown action: ${params.action}`, 404);
    }

    // Get auth user for commit operations
    let user = null;
    if (action === 'commit') {
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        throw new ImportError('UNAUTHORIZED', 'Authentication required for import operations', 401);
      }

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

      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !authUser) {
        throw new ImportError('UNAUTHORIZED', 'Invalid authentication', 401);
      }
      user = authUser;
    }

    // Parse request data
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
    } else if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}));
      const url = body?.googleSheetsUrl as string | undefined;
      fileName = body?.fileName;
      
      if (!url) {
        throw new ImportError('URL_MISSING', 'No Google Sheets/CSV URL provided');
      }
      
      csvBuffer = await fetchGoogleSheetsAsCsv(url);
    } else {
      throw new ImportError('UNSUPPORTED_CONTENT_TYPE', 'Expected multipart/form-data or application/json', 415);
    }

    // Check file size (10MB limit)
    if (csvBuffer.length > 10 * 1024 * 1024) {
      throw new ImportError('PAYLOAD_TOO_LARGE', 'CSV file too large (max 10MB)', 413);
    }

    console.log(`CONTACTS_${action.toUpperCase()}_START`, { 
      correlationId, 
      fileName, 
      csvSize: csvBuffer.length,
      userId: user?.id 
    });

    if (action === 'validate') {
      // Validate only (dry-run)
      const result = await normalizeHeadersParseCsvBuffer(csvBuffer, { 
        dryRun: true, 
        correlationId 
      });

      console.log('CONTACTS_VALIDATE_SUCCESS', { 
        correlationId, 
        totalRows: result.totalRows,
        validRows: result.validRows,
        errorCount: result.errorCount,
        warningsCount: result.warningsCount
      });

      return jsonOk({ 
        ok: true, 
        correlationId,
        action: 'validate',
        ...result 
      });
    }

    if (action === 'commit') {
      // Create Supabase client for commit operations
      const authHeader = req.headers.get('authorization');
      const supabase = createClient(
        'https://awdwtzawimyiavcsaddu.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZHd0emF3aW15aWF2Y3NhZGR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDI3OTUsImV4cCI6MjA3MTIxODc5NX0.JboQMlWHLFVioBCNGbSC27lh-eOleYOs_atdt0X2z8k',
        {
          global: {
            headers: {
              Authorization: authHeader!
            }
          }
        }
      );

      // Create import attempt record
      const { data: attempt, error: attemptError } = await supabase
        .from('import_attempts')
        .insert({
          user_id: user!.id,
          table_name: 'contacts',
          source_type: contentType.includes('multipart/form-data') ? 'csv-upload' : 'google-sheets-url',
          source_url: !contentType.includes('multipart/form-data') ? 
            (await req.json().catch(() => ({})))?.googleSheetsUrl : null,
          status: 'running',
          total_rows: 0,
          valid_rows: 0,
          error_count: 0,
          warnings_count: 0
        })
        .select()
        .single();

      if (attemptError) {
        throw new ImportError('DB_ERROR', `Failed to create import attempt: ${attemptError.message}`, 500);
      }

      try {
        // Parse and validate for commit
        const result = await normalizeHeadersParseCsvBuffer(csvBuffer, { 
          dryRun: false, 
          correlationId 
        });

        // Update attempt with results
        const { error: updateError } = await supabase
          .from('import_attempts')
          .update({
            status: result.errorCount > 0 ? 'failed' : 'completed',
            finished_at: new Date().toISOString(),
            total_rows: result.totalRows,
            valid_rows: result.validRows,
            upserted_rows: result.validRows, // For now, assume all valid rows are upserted
            error_count: result.errorCount,
            warnings_count: result.warningsCount,
            sample_json: result.sampleData
          })
          .eq('id', attempt.id);

        if (updateError) {
          console.error('Failed to update import attempt:', updateError);
        }

        // Save issues to database
        if (result.issues.length > 0) {
          const issues = result.issues.map(issue => ({
            attempt_id: attempt.id,
            row_number: issue.rowNumber,
            severity: issue.severity,
            code: issue.code,
            message: issue.message,
            field: issue.field,
            raw_row_json: issue.rawRowData
          }));

          const { error: issuesError } = await supabase
            .from('import_issues')
            .insert(issues);

          if (issuesError) {
            console.error('Failed to save import issues:', issuesError);
          }
        }

        console.log('CONTACTS_COMMIT_SUCCESS', { 
          correlationId, 
          attemptId: attempt.id,
          totalRows: result.totalRows,
          validRows: result.validRows,
          errorCount: result.errorCount,
          warningsCount: result.warningsCount
        });

        return jsonOk({ 
          ok: true, 
          correlationId,
          action: 'commit',
          attemptId: attempt.id,
          ...result 
        });

      } catch (processingError) {
        // Update attempt status to failed
        const { error: updateError } = await supabase
          .from('import_attempts')
          .update({
            status: 'failed',
            finished_at: new Date().toISOString(),
            error_summary: processingError instanceof Error ? processingError.message : 'Unknown error'
          })
          .eq('id', attempt.id);

        if (updateError) {
          console.error('Failed to update failed import attempt:', updateError);
        }

        throw processingError;
      }
    }

    // Should not reach here
    throw new ImportError('UNREACHABLE', 'Unreachable code path', 500);

  } catch (e: any) {
    const code = e?.code ?? 'UNHANDLED';
    const message = e?.message ?? 'Unknown error';
    const status = e?.status ?? 500;
    
    console.error('CONTACTS_IMPORT_ERROR', { 
      correlationId, 
      action: params.action,
      code, 
      message, 
      stack: e?.stack 
    });
    
    return jsonErr(code, message, correlationId, status);
  }
}