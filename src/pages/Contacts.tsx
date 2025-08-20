import React from 'react';
import { ContactsTable } from '@/components/data/ContactsTable';

export default function Contacts() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contacts</h1>
          <p className="text-muted-foreground">Manage your business contacts</p>
        </div>
      </div>

      <ContactsTable />
    </div>
  );
}