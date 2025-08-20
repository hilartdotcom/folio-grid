import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Link2, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download
} from 'lucide-react';

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: 'licenses' | 'companies' | 'contacts';
  onImportComplete?: () => void;
}

interface PreviewData {
  headers: string[];
  rows: string[][];
  totalRows: number;
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

export function ImportModal({
  open,
  onOpenChange,
  tableName,
  onImportComplete
}: ImportModalProps) {
  const [importType, setImportType] = useState<'csv_upload' | 'google_sheets'>('csv_upload');
  const [file, setFile] = useState<File | null>(null);
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [csvData, setCsvData] = useState('');
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<'setup' | 'preview' | 'importing' | 'complete'>('setup');
  const { toast } = useToast();

  const expectedHeaders = getExpectedHeaders(tableName);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvContent = e.target?.result as string;
        setCsvData(csvContent);
        generatePreview(csvContent);
      };
      reader.readAsText(selectedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleGoogleSheetsLoad = useCallback(async () => {
    if (!googleSheetsUrl) {
      toast({
        title: "Missing URL",
        description: "Please enter a Google Sheets CSV URL.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(googleSheetsUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch Google Sheets data');
      }
      
      const csvContent = await response.text();
      setCsvData(csvContent);
      generatePreview(csvContent);
      
      toast({
        title: "Google Sheets loaded",
        description: "Data successfully loaded from Google Sheets."
      });
    } catch (error) {
      toast({
        title: "Failed to load Google Sheets",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  }, [googleSheetsUrl, toast]);

  const generatePreview = (csvContent: string) => {
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = parseCSVLine(lines[0]);
    const rows = lines.slice(1, 101).map(line => parseCSVLine(line)); // Preview first 100 rows
    
    setPreviewData({
      headers,
      rows,
      totalRows: lines.length - 1
    });
    setStep('preview');
  };

  const parseCSVLine = (line: string): string[] => {
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
  };

  const validateHeaders = () => {
    if (!previewData) return { valid: false, missing: [], extra: [] };
    
    const missing = expectedHeaders.filter(header => 
      !previewData.headers.some(h => h.toLowerCase() === header.toLowerCase())
    );
    
    const extra = previewData.headers.filter(header =>
      !expectedHeaders.some(h => h.toLowerCase() === header.toLowerCase())
    );
    
    return {
      valid: missing.length === 0,
      missing,
      extra
    };
  };

  const startImport = async () => {
    if (!csvData) return;
    
    setImporting(true);
    setStep('importing');
    
    try {
      // Create import log entry
      const { data: importLog, error: logError } = await supabase
        .from('import_logs')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          table_name: tableName,
          import_type: importType,
          file_name: file?.name,
          source_url: importType === 'google_sheets' ? googleSheetsUrl : null,
          status: 'processing'
        })
        .select()
        .single();

      if (logError) throw logError;

      // Call edge function to process import
      const { data: result, error: importError } = await supabase.functions.invoke('process-import', {
        body: {
          importLogId: importLog.id,
          tableName,
          csvData,
          fileName: file?.name
        }
      });

      if (importError) throw importError;

      setImportResult(result);
      setStep('complete');
      
      toast({
        title: "Import completed",
        description: `Successfully processed ${result.processed} rows. ${result.imported} imported, ${result.updated} updated.`
      });
      
      onImportComplete?.();
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const resetModal = () => {
    setStep('setup');
    setFile(null);
    setGoogleSheetsUrl('');
    setCsvData('');
    setPreviewData(null);
    setImportResult(null);
    setImporting(false);
  };

  const handleClose = () => {
    resetModal();
    onOpenChange(false);
  };

  const validation = previewData ? validateHeaders() : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import {tableName.charAt(0).toUpperCase() + tableName.slice(1)}</DialogTitle>
          <DialogDescription>
            Import data from CSV files or Google Sheets
          </DialogDescription>
        </DialogHeader>

        {step === 'setup' && (
          <div className="space-y-6">
            <Tabs value={importType} onValueChange={(value) => setImportType(value as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="csv_upload">
                  <Upload className="h-4 w-4 mr-2" />
                  CSV Upload
                </TabsTrigger>
                <TabsTrigger value="google_sheets">
                  <Link2 className="h-4 w-4 mr-2" />
                  Google Sheets
                </TabsTrigger>
              </TabsList>

              <TabsContent value="csv_upload" className="space-y-4">
                <div>
                  <Label htmlFor="csv-file">Select CSV File</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="mt-2"
                  />
                </div>
              </TabsContent>

              <TabsContent value="google_sheets" className="space-y-4">
                <div>
                  <Label htmlFor="sheets-url">Google Sheets CSV URL</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="sheets-url"
                      placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
                      value={googleSheetsUrl}
                      onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                    />
                    <Button onClick={handleGoogleSheetsLoad} disabled={!googleSheetsUrl}>
                      Load
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Make sure your Google Sheet is published to the web as CSV
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Expected CSV headers for {tableName}:</p>
                  <div className="flex flex-wrap gap-1">
                    {expectedHeaders.map(header => (
                      <Badge key={header} variant="outline">{header}</Badge>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {step === 'preview' && previewData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Data Preview</h3>
              <Badge variant="outline">
                {previewData.totalRows} total rows
              </Badge>
            </div>

            {validation && (
              <div className="space-y-2">
                {!validation.valid && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Missing required headers: {validation.missing.join(', ')}
                    </AlertDescription>
                  </Alert>
                )}
                
                {validation.extra.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Extra headers (will be ignored): {validation.extra.join(', ')}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <div className="border rounded-lg max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {previewData.headers.map((header, i) => (
                      <TableHead key={i}>
                        <div className="flex items-center gap-2">
                          {header}
                          {expectedHeaders.includes(header) ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.rows.slice(0, 10).map((row, i) => (
                    <TableRow key={i}>
                      {row.map((cell, j) => (
                        <TableCell key={j}>{cell || '-'}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('setup')}>
                Back
              </Button>
              <Button 
                onClick={startImport} 
                disabled={!validation?.valid}
              >
                Start Import
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-4 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            <h3 className="text-lg font-semibold">Processing Import...</h3>
            <p className="text-muted-foreground">
              This may take a few moments depending on the size of your data.
            </p>
          </div>
        )}

        {step === 'complete' && importResult && (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Import Complete!</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-foreground">{importResult.processed}</div>
                <div className="text-sm text-muted-foreground">Processed</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importResult.imported}</div>
                <div className="text-sm text-muted-foreground">Imported</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{importResult.updated}</div>
                <div className="text-sm text-muted-foreground">Updated</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>

            {importResult.warnings.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Warnings ({importResult.warnings.length})</h4>
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importResult.warnings.map((warning, i) => (
                        <TableRow key={i}>
                          <TableCell>{warning.row}</TableCell>
                          <TableCell>{warning.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <Button onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function getExpectedHeaders(tableName: 'licenses' | 'companies' | 'contacts'): string[] {
  switch (tableName) {
    case 'licenses':
      return [
        'License Number',
        'License Type',
        'License Market',
        'License Category',
        'License Full Address',
        'License State',
        'License Country',
        'License Issue Date',
        'License Expiration Date',
        'License Issued By',
        'License Issued By Website',
        'License Last Updated Date'
      ];
    case 'companies':
      return [
        'Company Name',
        'Company DBA',
        'Company Website URL',
        'Company Linkedin URL',
        'Open for Business?',
        'License Number',
        'Company Last Updated Date'
      ];
    case 'contacts':
      return [
        'Contact Unique ID',
        'Contact Full Name',
        'Contact First Name',
        'Contact Last Name',
        'Contact Job Category',
        'Contact Email',
        'Contact Phone Number',
        'Contact Linkedin URL',
        'License Number',
        'Contact Last Updated Date'
      ];
    default:
      return [];
  }
}