import React from 'react';
import { Heading } from '@/components/catalyst/heading';
import { Text } from '@/components/catalyst/text';
import { ContactsTable } from '@/components/data/ContactsTable';

export default function Contacts() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Heading level={1}>Contacts</Heading>
          <Text>Manage your business contacts</Text>
        </div>
      </div>

      <ContactsTable />
    </div>
  );
}