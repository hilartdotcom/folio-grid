import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, Building2, Key, Settings, LogOut, User, BookOpen, Download } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
const mainNavItems = [{
  title: "Dashboard",
  url: "/",
  icon: Home
}, {
  title: "Contacts",
  url: "/contacts",
  icon: Users
}, {
  title: "Companies",
  url: "/companies",
  icon: Building2
}, {
  title: "Licenses",
  url: "/licenses",
  icon: Key
}];
const userNavItems = [{
  title: "Profile",
  url: "/profile",
  icon: User
}, {
  title: "Saved Views",
  url: "/saved-views",
  icon: BookOpen
}, {
  title: "Export Jobs",
  url: "/exports",
  icon: Download
}, {
  title: "Settings",
  url: "/settings",
  icon: Settings
}];
export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const location = useLocation();
  const {
    signOut,
    profile
  } = useAuth();
  const { roles } = useUserRoles();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';
  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };
  const getNavClassName = (path: string) => {
    const baseClasses = "sidebar-nav-item";
    if (isActive(path)) {
      return `${baseClasses} sidebar-nav-active`;
    }
    return `${baseClasses} sidebar-nav-inactive`;
  };
  const handleSignOut = async () => {
    await signOut();
  };
  return <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <div className="p-4 border-b border-sidebar-border">
        {!collapsed && <h2 className="text-lg font-bold text-sidebar-primary">cann.contact</h2>}
        
      </div>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Main Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/"} className={getNavClassName(item.url)}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {userNavItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClassName(item.url)}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="mt-auto p-3 border-t border-sidebar-border">
        {profile && !collapsed && <div className="mb-3 px-3">
            <p className="text-sm font-medium text-sidebar-foreground">
              {profile.name || 'User'}
            </p>
            {roles.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {roles.map(role => (
                  <Badge key={role} variant="secondary" className="text-xs capitalize">
                    {role}
                  </Badge>
                ))}
              </div>
            )}
          </div>}
        
        <Button variant="ghost" size="sm" onClick={handleSignOut} className={`w-full justify-start text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent ${collapsed ? 'px-2' : 'px-3'}`}>
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-3">Sign Out</span>}
        </Button>
      </div>
    </Sidebar>;
}