import React from 'react';
import { useLocation } from 'react-router-dom';
import { Home, Users, Building2, Key, User, BookOpen, Download, Settings, LogOut } from 'lucide-react';
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarBody, 
  SidebarFooter, 
  SidebarSection, 
  SidebarItem, 
  SidebarLabel,
  SidebarHeading,
  SidebarDivider 
} from '@/components/catalyst/sidebar';
import { Button } from '@/components/catalyst/button';
import { Badge } from '@/components/catalyst/badge';
import { Avatar } from '@/components/catalyst/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Contacts", url: "/contacts", icon: Users },
  { title: "Companies", url: "/companies", icon: Building2 },
  { title: "Licenses", url: "/licenses", icon: Key }
];

const userNavItems = [
  { title: "Profile", url: "/profile", icon: User },
  { title: "Saved Views", url: "/saved-views", icon: BookOpen },
  { title: "Export Jobs", url: "/exports", icon: Download },
  { title: "Settings", url: "/settings", icon: Settings }
];

export function CatalystSidebar() {
  const location = useLocation();
  const { signOut, profile } = useAuth();
  const { roles } = useUserRoles();
  
  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white text-sm font-medium dark:bg-white dark:text-zinc-900">
            C
          </div>
          <div>
            <div className="text-sm font-medium text-zinc-950 dark:text-white">
              cann.contact
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Cannabis CRM
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarBody>
        <SidebarSection>
          <SidebarHeading>Main Navigation</SidebarHeading>
          {mainNavItems.map((item) => (
            <SidebarItem 
              key={item.title} 
              href={item.url} 
              current={isActive(item.url)}
            >
              <item.icon data-slot="icon" />
              <SidebarLabel>{item.title}</SidebarLabel>
            </SidebarItem>
          ))}
        </SidebarSection>

        <SidebarDivider />

        <SidebarSection>
          <SidebarHeading>Account</SidebarHeading>
          {userNavItems.map((item) => (
            <SidebarItem 
              key={item.title} 
              href={item.url} 
              current={isActive(item.url)}
            >
              <item.icon data-slot="icon" />
              <SidebarLabel>{item.title}</SidebarLabel>
            </SidebarItem>
          ))}
        </SidebarSection>
      </SidebarBody>

      <SidebarFooter>
        {profile && (
          <SidebarSection>
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar className="size-8">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-500 text-white text-sm font-medium">
                  {(profile.name || 'U').charAt(0).toUpperCase()}
                </div>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-zinc-950 truncate dark:text-white">
                  {profile.name || 'User'}
                </div>
                {roles.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {roles.slice(0, 2).map(role => (
                      <Badge key={role} color="zinc" className="text-xs capitalize">
                        {role}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <SidebarItem onClick={handleSignOut}>
              <LogOut data-slot="icon" />
              <SidebarLabel>Sign Out</SidebarLabel>
            </SidebarItem>
          </SidebarSection>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}