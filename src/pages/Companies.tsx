import React from 'react';
import { Heading } from '@/components/catalyst/heading';
import { Text } from '@/components/catalyst/text';
import { CompaniesTable } from '@/components/data/CompaniesTable';

export default function Companies() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Heading level={1}>Companies</Heading>
          <Text>Manage your business relationships</Text>
        </div>
      </div>

      <CompaniesTable />
    </div>
  );
}