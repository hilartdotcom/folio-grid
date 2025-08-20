import React from 'react';
import { Heading } from '@/components/catalyst/heading';
import { Text } from '@/components/catalyst/text';
import { LicensesTable } from '@/components/data/LicensesTable';

export default function Licenses() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Heading level={1}>Licenses</Heading>
          <Text>Track dispensary licenses and subscriptions</Text>
        </div>
      </div>

      <LicensesTable />
    </div>
  );
}