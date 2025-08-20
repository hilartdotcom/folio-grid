import React from 'react';
import { Heading } from '@/components/catalyst/heading';
import { Text } from '@/components/catalyst/text';

export default function Exports() {
  return (
    <div className="space-y-6">
      <div>
        <Heading level={1}>Export Jobs</Heading>
        <Text>View and manage your data export history</Text>
      </div>
      
      <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm ring-1 ring-zinc-950/5 dark:ring-white/10">
        <Text>Export management coming soon...</Text>
      </div>
    </div>
  );
}