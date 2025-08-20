'use client'
import React from 'react'

// Catalyst components
import { SidebarLayout } from '@/components/catalyst/sidebar-layout'
import { Sidebar, SidebarHeader, SidebarSection, SidebarItem, SidebarBody } from '@/components/catalyst/sidebar'
import { Navbar } from '@/components/catalyst/navbar'

type Props = { current: 'home'|'contacts'|'companies'|'licenses'; children: React.ReactNode }

export default function AppShell({ current, children }: Props) {
  const sidebar = (
    <Sidebar>
      <SidebarHeader>
        <div className="p-4">
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">Cann.Contact</h2>
        </div>
      </SidebarHeader>
      <SidebarBody>
        <SidebarSection>
          <SidebarItem href="/" current={current==='home'}>
            <span data-slot="icon">🏠</span>
            <span>Home</span>
          </SidebarItem>
          <SidebarItem href="/contacts" current={current==='contacts'}>
            <span data-slot="icon">👤</span>
            <span>Contacts</span>
          </SidebarItem>
          <SidebarItem href="/companies" current={current==='companies'}>
            <span data-slot="icon">🏢</span>
            <span>Companies</span>
          </SidebarItem>
          <SidebarItem href="/licenses" current={current==='licenses'}>
            <span data-slot="icon">🧾</span>
            <span>Licenses</span>
          </SidebarItem>
        </SidebarSection>
      </SidebarBody>
    </Sidebar>
  )
  return <SidebarLayout navbar={<Navbar />} sidebar={sidebar}>{children}</SidebarLayout>
}