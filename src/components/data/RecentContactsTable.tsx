import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRecentContacts } from '@/hooks/useRecentContacts';
import { ArrowRight, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RecentContactsTableProps {
  limit?: number;
}

export function RecentContactsTable({ limit = 10 }: RecentContactsTableProps) {
  const { contacts, loading } = useRecentContacts(limit);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const hasEmail = (email?: string) => email && email.trim() !== '';
  const hasPhone = (phone?: string) => phone && phone.trim() !== '';

  if (loading) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Recently Added Contacts</CardTitle>
          <CardDescription>Latest contacts in your database</CardDescription>
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

  if (contacts.length === 0) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Recently Added Contacts</CardTitle>
          <CardDescription>Latest contacts in your database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No contacts found</p>
            <p className="text-sm">Import your first contacts to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recently Added Contacts</CardTitle>
          <CardDescription>Latest contacts in your database</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/contacts">
            View All
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Job Category</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map(contact => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {contact.full_name || `${contact.first_name} ${contact.last_name}`}
                      </div>
                      {contact.email && (
                        <div className="text-sm text-muted-foreground">{contact.email}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {contact.job_category ? (
                      <Badge variant="secondary">{contact.job_category}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
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
                    {contact.license_number ? (
                      <span className="font-mono text-sm">{contact.license_number}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(contact.contact_last_updated || contact.updated_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}