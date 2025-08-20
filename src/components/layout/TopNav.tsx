import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
const pageNames: Record<string, string> = {
  '/': 'Dashboard',
  '/contacts': 'Contacts',
  '/companies': 'Companies',
  '/licenses': 'Licenses',
  '/profile': 'Profile',
  '/saved-views': 'Saved Views',
  '/exports': 'Export Jobs',
  '/settings': 'Settings'
};
export function TopNav() {
  const location = useLocation();
  const currentPage = pageNames[location.pathname] || 'Page';
  const getBreadcrumbs = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs = [{
      name: 'Dashboard',
      path: '/'
    }];
    if (segments.length > 0 && path !== '/') {
      breadcrumbs.push({
        name: currentPage,
        path: path
      });
    }
    return breadcrumbs;
  };
  const breadcrumbs = getBreadcrumbs();
  return <header className="bg-card border-b border-card-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => <React.Fragment key={crumb.path}>
                {index > 0 && <ChevronRight className="h-4 w-4" />}
                
              </React.Fragment>)}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Future: Add search, notifications, user menu */}
        </div>
      </div>
    </header>;
}