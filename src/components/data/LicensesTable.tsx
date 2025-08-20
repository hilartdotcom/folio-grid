import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTableData } from '@/hooks/useTableData';
import { ImportButton } from '@/components/admin/ImportButton';
import { Search, Download, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

export function LicensesTable() {
  const {
    data: licenses,
    totalCount,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    pageSize,
    refetch
  } = useTableData({ tableName: 'licenses' });

  const isActive = (expirationDate?: string) => {
    if (!expirationDate) return true;
    return new Date(expirationDate) >= new Date();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Licenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse flex items-center space-x-4">
                <div className="h-4 bg-muted rounded w-32"></div>
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-4 bg-muted rounded w-16"></div>
                <div className="h-4 bg-muted rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Dispensary Licenses</CardTitle>
          <div className="flex gap-2">
            <ImportButton 
              tableName="licenses" 
              onImportComplete={refetch}
            />
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search licenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Market</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiration Date</TableHead>
                <TableHead>Issued By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No licenses found
                  </TableCell>
                </TableRow>
              ) : (
                licenses.map((license: any) => (
                  <TableRow key={license.id}>
                    <TableCell className="font-mono font-medium">
                      {license.license_number || '-'}
                    </TableCell>
                    <TableCell>
                      {license.license_type ? (
                        <Badge variant="secondary">{license.license_type}</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{license.license_market || '-'}</TableCell>
                    <TableCell>{license.license_category || '-'}</TableCell>
                    <TableCell>
                      {license.state ? (
                        <Badge variant="outline">{license.state}</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isActive(license.expiration_date) ? 'default' : 'destructive'}>
                        {isActive(license.expiration_date) ? 'Active' : 'Expired'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(license.expiration_date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {license.issued_by || '-'}
                        {license.issued_by_website && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={license.issued_by_website} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalCount > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}