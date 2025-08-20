import React from 'react';
import { KPICards } from '@/components/data/KPICards';
import { RecentContactsTable } from '@/components/data/RecentContactsTable';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your cann.contact dashboard</p>
      </div>
      
      <KPICards />

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <RecentContactsTable limit={10} />
      </div>
    </div>
  );
}