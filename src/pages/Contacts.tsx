'use client'
import React from 'react'
import AppShell from '@/layouts/AppShell'
import { Heading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { Table } from '@/components/catalyst/table'
import { Input } from '@/components/catalyst/input'

export default function ContactsPage(){
  const rows=[
    {id:'CNT-001',first:'Jane',last:'Doe',job:'Operations',email:'jane@example.com',phone:'555-0123',license:'LIC-ABC',updated:'08/01/2025'},
    {id:'CNT-002',first:'John',last:'Smith',job:'Owner',email:'john@example.com',phone:'—',license:'LIC-XYZ',updated:'07/29/2025'}
  ]
  return (
    <AppShell current="contacts">
      <div className="p-6 space-y-4">
        <Heading level={1}>Contacts</Heading>
        <div className="flex gap-3">
          <Input placeholder="Search first/last name…" className="max-w-xs" />
        </div>
        <div className="rounded-2xl border overflow-hidden">
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.Header>First</Table.Header>
                <Table.Header>Last</Table.Header>
                <Table.Header>Job</Table.Header>
                <Table.Header>Email</Table.Header>
                <Table.Header>Phone</Table.Header>
                <Table.Header>License</Table.Header>
                <Table.Header>Updated</Table.Header>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {rows.map(r=>(
                <Table.Row key={r.id}>
                  <Table.Cell>{r.first}</Table.Cell>
                  <Table.Cell>{r.last}</Table.Cell>
                  <Table.Cell>{r.job}</Table.Cell>
                  <Table.Cell>{r.email}</Table.Cell>
                  <Table.Cell>{r.phone}</Table.Cell>
                  <Table.Cell>{r.license}</Table.Cell>
                  <Table.Cell>{r.updated}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
        <Text className="text-sm text-zinc-500">Hook up Supabase next.</Text>
      </div>
    </AppShell>
  )
}