'use client'
import React from 'react'
import AppShell from '@/layouts/AppShell'
import { Heading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { Table } from '@/components/catalyst/table'
import { Input } from '@/components/catalyst/input'
import { Badge } from '@/components/catalyst/badge'

export default function CompaniesPage(){
  const rows=[
    {id:'COMP-001',name:'Green Leaf Dispensary',dba:'Green Leaf',website:'greenleaf.com',open:true,license:'LIC-ABC',updated:'08/01/2025'},
    {id:'COMP-002',name:'Mountain High Cannabis',dba:'—',website:'mountainhigh.com',open:false,license:'LIC-XYZ',updated:'07/29/2025'}
  ]
  return (
    <AppShell current="companies">
      <div className="p-6 space-y-4">
        <Heading level={1}>Companies</Heading>
        <div className="flex gap-3">
          <Input placeholder="Search company name…" className="max-w-xs" />
        </div>
        <div className="rounded-2xl border overflow-hidden">
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.Header>Company Name</Table.Header>
                <Table.Header>DBA</Table.Header>
                <Table.Header>Website</Table.Header>
                <Table.Header>Status</Table.Header>
                <Table.Header>License</Table.Header>
                <Table.Header>Updated</Table.Header>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {rows.map(r=>(
                <Table.Row key={r.id}>
                  <Table.Cell>{r.name}</Table.Cell>
                  <Table.Cell>{r.dba}</Table.Cell>
                  <Table.Cell>{r.website}</Table.Cell>
                  <Table.Cell><Badge color={r.open ? 'green' : 'red'}>{r.open ? 'Open' : 'Closed'}</Badge></Table.Cell>
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