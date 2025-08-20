import React from 'react';
import { Heading } from '@/components/catalyst/heading';
import { Text } from '@/components/catalyst/text';
import { KPICards } from '@/components/data/KPICards';
import { RecentContactsTable } from '@/components/data/RecentContactsTable';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <Heading level={1}>Dashboard</Heading>
        <Text>Welcome to your cann.contact dashboard</Text>
      </div>
      
      <KPICards />

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <RecentContactsTable limit={10} />
      </div>
    </div>
  );
}