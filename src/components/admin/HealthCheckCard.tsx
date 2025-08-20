import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiPath } from '@/lib/api';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

export function HealthCheckCard() {
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<'unknown' | 'healthy' | 'error'>('unknown');
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setChecking(true);
    setError(null);
    
    try {
      const response = await fetch(apiPath('/api/imports/contacts/health'));
      const data = await response.json();
      
      if (response.ok && data.ok) {
        setStatus('healthy');
        setLastCheck(new Date().toLocaleTimeString());
      } else {
        setStatus('error');
        setError(`API returned ${response.status}: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to connect to API');
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status === 'healthy' && <CheckCircle className="h-5 w-5 text-green-500" />}
          {status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
          {status === 'unknown' && <Clock className="h-5 w-5 text-gray-500" />}
          API Health Check
        </CardTitle>
        <CardDescription>
          Verify that the import API endpoints are responding correctly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Status:</span>
            <Badge variant={
              status === 'healthy' ? 'default' : 
              status === 'error' ? 'destructive' : 
              'secondary'
            }>
              {status === 'healthy' ? 'Healthy' : 
               status === 'error' ? 'Error' : 
               'Unknown'}
            </Badge>
          </div>
          <Button 
            onClick={checkHealth} 
            disabled={checking}
            variant="outline"
            size="sm"
          >
            {checking ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Check Now
          </Button>
        </div>
        
        {lastCheck && (
          <div className="text-sm text-muted-foreground">
            Last checked: {lastCheck}
          </div>
        )}
        
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="text-sm text-muted-foreground">
          <p>You can also test manually by visiting:</p>
          <code className="bg-muted px-2 py-1 rounded text-xs">
            {apiPath('/api/imports/contacts/health')}
          </code>
        </div>
      </CardContent>
    </Card>
  );
}