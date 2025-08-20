import React, { useState, useEffect } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { apiPath } from '@/lib/api';
import { HealthCheckCard } from './HealthCheckCard';
import { 
  Upload, 
  Link2, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  Play,
  Eye,
  History,
  Filter,
  Copy
} from 'lucide-react';

interface ImportDiagnosticsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: 'licenses' | 'companies' | 'contacts';
  onImportComplete?: () => void;
}

interface ImportAttempt {
  id: string;
  table_name: string;
  source_type: string;
  source_url: string | null;
  started_at: string;
  finished_at: string | null;
  status: string;
  total_rows: number | null;
  valid_rows: number | null;
  upserted_rows: number | null;
  skipped_rows: number | null;
  error_count: number;
  warnings_count: number;
  error_summary: string | null;
  sample_json: any;
}

interface ImportIssue {
  id: string;
  row_number: number | null;
  severity: 'error' | 'warning';
  code: string;
  message: string;
  raw_row_json: any;
  field: string | null;
  created_at: string;
}

interface ValidationResult {
  attemptId: string;
  status: string;
  totalRows: number;
  validRows: number;
  errorCount: number;
  warningsCount: number;
  issues: ImportIssue[];
  sampleJson?: any;
}

export function ImportDiagnosticsModal({
  open,
  onOpenChange,
  tableName,
  onImportComplete
}: ImportDiagnosticsModalProps) {
  const [importType, setImportType] = useState<'csv_upload' | 'google_sheets'>('csv_upload');
  const [file, setFile] = useState<File | null>(null);
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [csvData, setCsvData] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [step, setStep] = useState<'setup' | 'validation' | 'history' | 'importing' | 'complete'>('setup');
  const [attempts, setAttempts] = useState<ImportAttempt[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<ImportAttempt | null>(null);
  const [attemptIssues, setAttemptIssues] = useState<ImportIssue[]>([]);
  const [issueFilter, setIssueFilter] = useState<'all' | 'errors' | 'warnings'>('all');
  const { toast } = useToast();

  const expectedHeaders = getExpectedHeaders(tableName);

  useEffect(() => {
    if (open && step === 'history') {
      loadImportHistory();
    }
  }, [open, step]);

  const handleFileChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvContent = e.target?.result as string;
        setCsvData(csvContent);
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

  const handleGoogleSheetsLoad = React.useCallback(async () => {
    if (!googleSheetsUrl) {
      toast({
        title: "Missing URL",
        description: "Please enter a Google Sheets URL.",
        variant: "destructive"
      });
      return;
    }

    // The diagnostics function will handle URL transformation
    setCsvData(''); // Clear CSV data, let the function handle the URL
    toast({
      title: "Google Sheets URL loaded",
      description: "Ready to validate or import from Google Sheets."
    });
  }, [googleSheetsUrl, toast]);

  const runValidation = async (dryRun = true) => {
    if (!csvData && !googleSheetsUrl) {
      toast({
        title: "No data",
        description: "Please upload a CSV file or provide a Google Sheets URL.",
        variant: "destructive"
      });
      return;
    }
    
    setValidating(true);
    
    try {
      // Get the current user session token
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      let response: Response;
      
      if (file && csvData) {
        // File upload
        const formData = new FormData();
        formData.append('file', file);
        
        const headers: Record<string, string> = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        response = await fetch(apiPath(`/api/imports/contacts/${dryRun ? 'validate' : 'commit'}`), {
          method: 'POST',
          headers,
          body: formData
        });
      } else if (googleSheetsUrl) {
        // Google Sheets URL
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        response = await fetch(apiPath(`/api/imports/contacts/${dryRun ? 'validate' : 'commit'}`), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            googleSheetsUrl,
            fileName: file?.name
          })
        });
      } else {
        throw new Error('No data source provided');
      }

      let result: any;
      try {
        result = await response.json();
      } catch {
        throw new Error(`Import failed (${response.status})`);
      }

      if (!response.ok || !result?.ok) {
        const message = result?.message ?? `Import failed (${response.status})`;
        const code = result?.code ?? 'UNKNOWN';
        const id = result?.correlationId ? ` [${result.correlationId}]` : '';
        throw new Error(`${code}: ${message}${id}`);
      }

      setValidationResult(result);
      setStep('validation');
      
      toast({
        title: dryRun ? "Validation complete" : "Import complete",
        description: `Found ${result.totalRows} total rows, ${result.validRows} valid rows, ${result.errorCount} errors, ${result.warningsCount} warnings.`
      });
      
      if (!dryRun) {
        onImportComplete?.();
      }
    } catch (error) {
      console.error('Validation/Import failed:', error);
      toast({
        title: "Operation failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setValidating(false);
      setImporting(false);
    }
  };

  const startImport = async () => {
    setImporting(true);
    await runValidation(false);
  };

  const loadImportHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('import_attempts')
        .select('*')
        .eq('table_name', tableName)
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setAttempts(data || []);
    } catch (error) {
      console.error('Failed to load import history:', error);
      toast({
        title: "Failed to load history",
        description: "Could not load import history.",
        variant: "destructive"
      });
    }
  };

  const loadAttemptDetails = async (attempt: ImportAttempt) => {
    try {
      const { data, error } = await supabase
        .from('import_issues')
        .select('*')
        .eq('attempt_id', attempt.id)
        .order('row_number', { ascending: true });

      if (error) throw error;
      setSelectedAttempt(attempt);
      setAttemptIssues((data || []).map(issue => ({
        ...issue,
        severity: issue.severity as 'error' | 'warning'
      })));
    } catch (error) {
      console.error('Failed to load attempt details:', error);
      toast({
        title: "Failed to load details",
        description: "Could not load attempt details.",
        variant: "destructive"
      });
    }
  };

  const downloadValidationReport = () => {
    if (!validationResult) return;

    const csvContent = [
      ['Row', 'Severity', 'Code', 'Message', 'Field', 'Raw Data'],
      ...validationResult.issues.map(issue => [
        issue.row_number || '',
        issue.severity,
        issue.code,
        issue.message,
        issue.field || '',
        JSON.stringify(issue.raw_row_json || {})
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-validation-${tableName}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSampleJson = () => {
    if (!validationResult?.sampleJson) return;

    const jsonContent = JSON.stringify(validationResult.sampleJson, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-sample-${tableName}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetModal = () => {
    setStep('setup');
    setFile(null);
    setGoogleSheetsUrl('');
    setCsvData('');
    setValidationResult(null);
    setSelectedAttempt(null);
    setAttemptIssues([]);
    setImporting(false);
    setValidating(false);
  };

  const handleClose = () => {
    resetModal();
    onOpenChange(false);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'running': 'secondary',
      'succeeded': 'default',
      'failed': 'destructive',
      'partial': 'secondary'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  const filteredIssues = attemptIssues.filter(issue => {
    if (issueFilter === 'all') return true;
    return issue.severity === issueFilter.slice(0, -1); // Remove 's' from 'errors'/'warnings'
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import {tableName.charAt(0).toUpperCase() + tableName.slice(1)} - Advanced Diagnostics</DialogTitle>
          <DialogDescription>
            Import data with comprehensive validation, error reporting, and dry-run capabilities
          </DialogDescription>
        </DialogHeader>

        <Tabs value={step} onValueChange={(value) => setStep(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup">Setup & Import</TabsTrigger>
            <TabsTrigger value="validation">Validation Results</TabsTrigger>
            <TabsTrigger value="history">Import History</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-6">
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
                    <Label htmlFor="sheets-url">Google Sheets URL</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="sheets-url"
                        placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
                        value={googleSheetsUrl}
                        onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                      />
                      <Button onClick={handleGoogleSheetsLoad} disabled={!googleSheetsUrl}>
                        Load
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Paste any Google Sheets URL - we'll auto-convert it to the CSV export format
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

              <div className="flex gap-4">
                <Button 
                  onClick={() => runValidation(true)}
                  disabled={(!csvData && !googleSheetsUrl) || validating}
                  variant="outline"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {validating ? 'Validating...' : 'Validate (Dry Run)'}
                </Button>
                
                <Button 
                  onClick={startImport}
                  disabled={(!csvData && !googleSheetsUrl) || importing}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {importing ? 'Importing...' : 'Start Import'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="validation" className="space-y-6">
            {validationResult ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-2xl">{validationResult.totalRows}</CardTitle>
                      <CardDescription>Total Rows</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-2xl text-green-600">{validationResult.validRows}</CardTitle>
                      <CardDescription>Valid Rows</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-2xl text-red-600">{validationResult.errorCount}</CardTitle>
                      <CardDescription>Errors</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-2xl text-yellow-600">{validationResult.warningsCount}</CardTitle>
                      <CardDescription>Warnings</CardDescription>
                    </CardHeader>
                  </Card>
                </div>

                <div className="flex gap-2">
                  <Button onClick={downloadValidationReport} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download Report (CSV)
                  </Button>
                  {validationResult.sampleJson && (
                    <Button onClick={downloadSampleJson} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download Sample (JSON)
                    </Button>
                  )}
                </div>

                {validationResult.issues.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Issues ({validationResult.issues.length})</h3>
                      <Select value={issueFilter} onValueChange={(value: any) => setIssueFilter(value)}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Issues</SelectItem>
                          <SelectItem value="errors">Errors Only</SelectItem>
                          <SelectItem value="warnings">Warnings Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="border rounded-lg max-h-96 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Row</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead>Field</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validationResult.issues.slice(0, 50).map((issue, i) => (
                            <TableRow key={i}>
                              <TableCell>{issue.row_number || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={issue.severity === 'error' ? 'destructive' : 'secondary'}>
                                  {issue.severity}
                                </Badge>
                              </TableCell>
                              <TableCell><code className="text-xs">{issue.code}</code></TableCell>
                              <TableCell>{issue.message}</TableCell>
                              <TableCell>{issue.field || '-'}</TableCell>
                              <TableCell>
                                {issue.raw_row_json && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(JSON.stringify(issue.raw_row_json, null, 2));
                                      toast({ title: "Copied raw row data to clipboard" });
                                    }}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No validation results yet. Run a validation or import first.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Import History</h3>
                <Button onClick={loadImportHistory} variant="outline" size="sm">
                  <History className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              <div className="grid gap-4">
                {attempts.map((attempt) => (
                  <Card key={attempt.id} className="cursor-pointer hover:bg-muted/50" onClick={() => loadAttemptDetails(attempt)}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(attempt.status)}
                          <span className="text-sm text-muted-foreground">
                            {new Date(attempt.started_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {attempt.total_rows || 0} rows
                        </div>
                      </div>
                      <CardDescription>
                        {attempt.source_type === 'google-sheets-url' ? 'Google Sheets' : 'CSV Upload'}
                        {attempt.error_summary && ` • ${attempt.error_summary}`}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              {selectedAttempt && (
                <Card>
                  <CardHeader>
                    <CardTitle>Attempt Details</CardTitle>
                    <CardDescription>
                      {selectedAttempt.source_type === 'google-sheets-url' ? 'Google Sheets' : 'CSV Upload'} • 
                      {new Date(selectedAttempt.started_at).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{selectedAttempt.total_rows || 0}</div>
                        <div className="text-sm text-muted-foreground">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{selectedAttempt.upserted_rows || 0}</div>
                        <div className="text-sm text-muted-foreground">Imported</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{selectedAttempt.error_count}</div>
                        <div className="text-sm text-muted-foreground">Errors</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{selectedAttempt.warnings_count}</div>
                        <div className="text-sm text-muted-foreground">Warnings</div>
                      </div>
                    </div>

                    {filteredIssues.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">Issues</h4>
                          <Select value={issueFilter} onValueChange={(value: any) => setIssueFilter(value)}>
                            <SelectTrigger className="w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Issues</SelectItem>
                              <SelectItem value="errors">Errors Only</SelectItem>
                              <SelectItem value="warnings">Warnings Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="border rounded-lg max-h-64 overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Row</TableHead>
                                <TableHead>Severity</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Message</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredIssues.slice(0, 20).map((issue) => (
                                <TableRow key={issue.id}>
                                  <TableCell>{issue.row_number || '-'}</TableCell>
                                  <TableCell>
                                    <Badge variant={issue.severity === 'error' ? 'destructive' : 'secondary'}>
                                      {issue.severity}
                                    </Badge>
                                  </TableCell>
                                  <TableCell><code className="text-xs">{issue.code}</code></TableCell>
                                  <TableCell>{issue.message}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function getExpectedHeaders(tableName: 'licenses' | 'companies' | 'contacts'): string[] {
  switch (tableName) {
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