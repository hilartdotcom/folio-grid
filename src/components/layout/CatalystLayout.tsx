import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarLayout } from '@/components/catalyst/sidebar-layout';
import { CatalystSidebar } from './CatalystSidebar';
import { CatalystNavbar } from './CatalystNavbar';

export function CatalystLayout() {
  return (
    <SidebarLayout
      navbar={<CatalystNavbar />}
      sidebar={<CatalystSidebar />}
    >
      <Outlet />
    </SidebarLayout>
  );
}