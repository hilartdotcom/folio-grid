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
import { Search, Download, ExternalLink, ChevronLeft, ChevronRight, Mail, Phone } from 'lucide-react';

export function ContactsTable() {
  const {
    data: contacts,
    totalCount,
    loading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize
  } = useTableData({ tableName: 'contacts' });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const hasEmail = (email?: string) => email && email.trim() !== '';
  const hasPhone = (phone?: string) => phone && phone.trim() !== '';

  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
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
          <CardTitle>Contacts</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
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
                <TableHead>Name</TableHead>
                <TableHead>Job Category</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>LinkedIn</TableHead>
                <TableHead>License Number</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No contacts found
                  </TableCell>
                </TableRow>
              ) : (
                contacts.map((contact: any) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      <div>
                        {contact.full_name || `${contact.first_name} ${contact.last_name}`}
                        {contact.contact_unique_id && (
                          <div className="text-xs text-muted-foreground font-mono">
                            ID: {contact.contact_unique_id}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.job_category ? (
                        <Badge variant="secondary">{contact.job_category}</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {contact.email ? (
                        <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                          {contact.email}
                        </a>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{contact.phone_number || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {hasEmail(contact.email) && (
                          <Badge variant="outline" className="text-xs">
                            <Mail className="h-3 w-3 mr-1" />
                            Email
                          </Badge>
                        )}
                        {hasPhone(contact.phone_number) && (
                          <Badge variant="outline" className="text-xs">
                            <Phone className="h-3 w-3 mr-1" />
                            Phone
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.linkedin_url ? (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="font-mono">
                      {contact.license_number || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(contact.contact_last_updated || contact.updated_at)}
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