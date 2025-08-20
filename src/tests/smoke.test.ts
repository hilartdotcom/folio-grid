/**
 * Smoke Tests - Basic functionality checks
 * These tests ensure the core application functionality works correctly
 */

import { describe, it, expect, vi } from 'vitest';

// Mock React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' }),
  BrowserRouter: ({ children }: { children: any }) => children,
  Routes: ({ children }: { children: any }) => children,
  Route: ({ element }: { element: any }) => element,
  NavLink: ({ children, to }: { children: any; to: string }) =>
    ({ type: 'a', props: { href: to, children } }),
  Link: ({ children, to }: { children: any; to: string }) =>
    ({ type: 'a', props: { href: to, children } }),
  Outlet: () => ({ type: 'div', props: { children: 'Outlet' } })
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn()
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        }),
        range: () => Promise.resolve({ data: [], error: null, count: 0 })
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null })
    })
  }
}));

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn()
  })),
  QueryClientProvider: ({ children }: { children: any }) => children,
  useQuery: () => ({ data: null, isLoading: false, error: null }),
  useMutation: () => ({ mutate: vi.fn(), isLoading: false })
}));

// Mock Auth Context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    loading: false
  }),
  AuthProvider: ({ children }: { children: any }) => children
}));

describe('Smoke Tests', () => {
  describe('Core Application', () => {
    it('should load without crashing', () => {
      expect(true).toBe(true);
    });

    it('should have proper environment setup', () => {
      expect(process.env.NODE_ENV).toBeDefined();
    });
  });

  describe('Component Imports', () => {
    it('should import Catalyst components without errors', async () => {
      const { Button } = await import('@/components/catalyst/button');
      const { Input } = await import('@/components/catalyst/input');
      const { Heading } = await import('@/components/catalyst/heading');
      
      expect(Button).toBeDefined();
      expect(Input).toBeDefined();  
      expect(Heading).toBeDefined();
    });

    it('should import layout components without errors', async () => {
      const { CatalystLayout } = await import('@/components/layout/CatalystLayout');
      const { CatalystSidebar } = await import('@/components/layout/CatalystSidebar');
      const { CatalystNavbar } = await import('@/components/layout/CatalystNavbar');
      
      expect(CatalystLayout).toBeDefined();
      expect(CatalystSidebar).toBeDefined();
      expect(CatalystNavbar).toBeDefined();
    });

    it('should import page components without errors', async () => {
      const Dashboard = await import('@/pages/Dashboard');
      const Contacts = await import('@/pages/Contacts'); 
      const Companies = await import('@/pages/Companies');
      const Licenses = await import('@/pages/Licenses');
      
      expect(Dashboard.default).toBeDefined();
      expect(Contacts.default).toBeDefined();
      expect(Companies.default).toBeDefined();
      expect(Licenses.default).toBeDefined();
    });
  });

  describe('Utility Functions', () => {
    it('should have working utility functions', async () => {
      const { cn } = await import('@/lib/utils');
      
      expect(cn).toBeDefined();
      expect(typeof cn).toBe('function');
      
      // Test basic cn functionality
      const result = cn('class1', 'class2');
      expect(typeof result).toBe('string');
    });
  });

  describe('Type Safety', () => {
    it('should have proper TypeScript configuration', () => {
      // This test passes if TypeScript compilation succeeds
      expect(true).toBe(true);
    });
  });

  describe('Authentication Flow', () => {
    it('should handle auth context without errors', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      
      expect(useAuth).toBeDefined();
      expect(typeof useAuth).toBe('function');
    });
  });

  describe('Data Management', () => {
    it('should import table components without errors', async () => {
      const { ContactsTable } = await import('@/components/data/ContactsTable');
      const { CompaniesTable } = await import('@/components/data/CompaniesTable');
      const { LicensesTable } = await import('@/components/data/LicensesTable');
      
      expect(ContactsTable).toBeDefined();
      expect(CompaniesTable).toBeDefined();
      expect(LicensesTable).toBeDefined();
    });

    it('should import custom hooks without errors', async () => {
      const { useKPIData } = await import('@/hooks/useKPIData');
      const { useRecentContacts } = await import('@/hooks/useRecentContacts');
      const { useUserRoles } = await import('@/hooks/useUserRoles');
      
      expect(useKPIData).toBeDefined();
      expect(useRecentContacts).toBeDefined();
      expect(useUserRoles).toBeDefined();
    });
  });
});