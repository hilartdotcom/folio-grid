import React from 'react';
import { LicensesTable } from '@/components/data/LicensesTable';

export default function Licenses() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Licenses</h1>
          <p className="text-muted-foreground">Track dispensary licenses and subscriptions</p>
        </div>
      </div>

      <LicensesTable />
    </div>
  );
}