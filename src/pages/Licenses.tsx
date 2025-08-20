'use client'
import React from 'react'
import AppShell from '@/layouts/AppShell'
import { Heading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { Table } from '@/components/catalyst/table'
import { Input } from '@/components/catalyst/input'
import { Badge } from '@/components/catalyst/badge'

export default function LicensesPage(){
  const rows=[
    {id:'LIC-ABC',type:'Dispensary',market:'Adult Use',category:'Retail',state:'CA',country:'US',issued:'01/15/2024',expires:'01/15/2026',updated:'08/01/2025'},
    {id:'LIC-XYZ',type:'Cultivation',market:'Medical',category:'Indoor',state:'CO',country:'US',issued:'03/20/2023',expires:'03/20/2025',updated:'07/29/2025'}
  ]
  return (
    <AppShell current="licenses">
      <div className="p-6 space-y-4">
        <Heading level={1}>Licenses</Heading>
        <div className="flex gap-3">
          <Input placeholder="Search license number…" className="max-w-xs" />
        </div>
        <div className="rounded-2xl border overflow-hidden">
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.Header>License #</Table.Header>
                <Table.Header>Type</Table.Header>
                <Table.Header>Market</Table.Header>
                <Table.Header>Category</Table.Header>
                <Table.Header>State</Table.Header>
                <Table.Header>Issued</Table.Header>
                <Table.Header>Expires</Table.Header>
                <Table.Header>Updated</Table.Header>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {rows.map(r=>(
                <Table.Row key={r.id}>
                  <Table.Cell>{r.id}</Table.Cell>
                  <Table.Cell>{r.type}</Table.Cell>
                  <Table.Cell><Badge>{r.market}</Badge></Table.Cell>
                  <Table.Cell>{r.category}</Table.Cell>
                  <Table.Cell>{r.state}</Table.Cell>
                  <Table.Cell>{r.issued}</Table.Cell>
                  <Table.Cell><Badge color="green">{r.expires}</Badge></Table.Cell>
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