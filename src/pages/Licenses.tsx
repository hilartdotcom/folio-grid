import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Download, Key } from 'lucide-react';

export default function Licenses() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Licenses</h1>
          <p className="text-muted-foreground">Track software licenses and subscriptions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button className="btn-primary" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add License
          </Button>
        </div>
      </div>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>License Management</CardTitle>
          <CardDescription>
            Advanced data table with filtering, sorting, and search capabilities coming soon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No licenses found</p>
              <p className="text-sm">Get started by adding your first license</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}