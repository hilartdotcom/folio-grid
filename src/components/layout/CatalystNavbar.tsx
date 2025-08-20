import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight, Search, Bell } from 'lucide-react';
import { 
  Navbar, 
  NavbarSection, 
  NavbarSpacer, 
  NavbarItem,
  NavbarLabel
} from '@/components/catalyst/navbar';
import { Button } from '@/components/catalyst/button';
import { Badge } from '@/components/catalyst/badge';

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

export function CatalystNavbar() {
  const location = useLocation();
  const currentPage = pageNames[location.pathname] || 'Page';
  
  const getBreadcrumbs = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Dashboard', path: '/' }];
    
    if (segments.length > 0 && path !== '/') {
      breadcrumbs.push({
        name: currentPage,
        path: path
      });
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <Navbar>
      <NavbarSection>
        <nav className="flex items-center space-x-2 text-sm text-zinc-500 dark:text-zinc-400">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.path}>
              {index > 0 && <ChevronRight className="h-4 w-4" />}
              <span className={index === breadcrumbs.length - 1 ? 'text-zinc-950 dark:text-white font-medium' : ''}>
                {crumb.name}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </NavbarSection>

      <NavbarSpacer />

      <NavbarSection>
        <NavbarItem aria-label="Search">
          <Search data-slot="icon" />
        </NavbarItem>
        
        <NavbarItem aria-label="Notifications">
          <Bell data-slot="icon" />
          <Badge color="red" className="absolute -top-1 -right-1 size-5 flex items-center justify-center text-xs">
            3
          </Badge>
        </NavbarItem>
      </NavbarSection>
    </Navbar>
  );
}