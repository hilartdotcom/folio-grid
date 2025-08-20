'use client'
import React from 'react'
import AppShell from '@/layouts/AppShell'
import { Heading } from '@/components/catalyst/heading'
import { Text } from '@/components/catalyst/text'
import { Divider } from '@/components/catalyst/divider'
import { Table } from '@/components/catalyst/table'
import { Button } from '@/components/catalyst/button'
import { Badge } from '@/components/catalyst/badge'

export default function HomePage() {
  const kpis = [
    { label: 'Total licenses', value: 0 },
    { label: 'Total companies', value: 0 },
    { label: 'Total contacts', value: 0 },
    { label: 'Total states', value: 0 },
  ]
  const recent = [
    { id:'CNT-001', name:'Jane Doe', job:'Operations', license:'LIC-ABC', updated:'08/01/2025' },
    { id:'CNT-002', name:'John Smith', job:'Owner', license:'LIC-XYZ', updated:'07/29/2025' },
  ]
  return (
    <AppShell current="home">
      <div className="p-6 space-y-8">
        <header className="space-y-2">
          <Heading level={1}>Dashboard</Heading>
          <Text className="text-zinc-500">Overview of your dataset</Text>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map(k=>(
            <div key={k.label} className="rounded-2xl border p-4">
              <Text className="text-sm text-zinc-500">{k.label}</Text>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{k.value}</div>
            </div>
          ))}
        </section>

        <Divider />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <Heading level={2}>Recently added contacts</Heading>
            <Button href="/contacts" color="indigo">View all</Button>
          </div>

          <div className="rounded-2xl border overflow-hidden">
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.Header>Contact</Table.Header>
                  <Table.Header>Job</Table.Header>
                  <Table.Header>License</Table.Header>
                  <Table.Header>Last updated</Table.Header>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {recent.map(c=>(
                  <Table.Row key={c.id}>
                    <Table.Cell>{c.name}</Table.Cell>
                    <Table.Cell><Badge>{c.job}</Badge></Table.Cell>
                    <Table.Cell>{c.license}</Table.Cell>
                    <Table.Cell>{c.updated}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </section>
      </div>
    </AppShell>
  )
}