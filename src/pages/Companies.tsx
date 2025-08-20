import React from 'react';
import { CompaniesTable } from '@/components/data/CompaniesTable';

export default function Companies() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Companies</h1>
          <p className="text-muted-foreground">Manage your business relationships</p>
        </div>
      </div>

      <CompaniesTable />
    </div>
  );
}