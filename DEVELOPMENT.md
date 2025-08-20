# Development Guide

## Project Structure

```
src/
├── components/
│   ├── catalyst/          # Catalyst UI design system components
│   ├── data/             # Data display components (tables, cards)
│   ├── layout/           # Layout components (sidebar, navbar)
│   └── ui/               # shadcn/ui components
├── contexts/             # React contexts (auth, theme)
├── hooks/                # Custom React hooks
├── integrations/         # External service integrations
├── lib/                  # Utility functions
├── pages/                # Route components
├── styles/               # Global styles and CSS
├── tests/                # Test files
└── types/                # TypeScript type definitions
```

## Component Architecture

### Catalyst Design System
The project uses a comprehensive Catalyst UI design system with:
- **Form Controls**: Input, Textarea, Select, Checkbox, Radio, Switch
- **Navigation**: Sidebar, Navbar, Dropdown menus
- **Layout**: Responsive layouts with mobile support
- **Data Display**: Tables, Pagination, Description lists
- **Feedback**: Dialogs, Alerts, Badges
- **Typography**: Headings, Text with proper semantic hierarchy

### Data Components
- **DataTable**: Reusable table with sorting, filtering, pagination
- **KPICards**: Dashboard metrics display
- **ContactsTable**: Contact management interface
- **CompaniesTable**: Company relationship management
- **LicensesTable**: License tracking interface

## Development Workflow

### 1. Setting Up Development Environment

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run type-check
```

### 2. Code Quality

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Run tests
npm run test
```

### 3. Database Development

```bash
# Generate types from Supabase schema
npm run db:types

# Access Supabase dashboard
# Visit your Supabase project dashboard to manage database
```

## Authentication Flow

### User Authentication
1. **Sign Up**: Creates user account with email verification
2. **Sign In**: Authenticates user with email/password
3. **Session Management**: Automatic session refresh and persistence
4. **Protected Routes**: Route guards for authenticated content
5. **Role-Based Access**: User roles and permissions system

### Implementation Details
- Uses Supabase Auth for secure authentication
- Context-based state management for auth state
- Automatic redirect handling for protected routes
- Profile management with user metadata

## Database Schema

### Core Tables
- **contacts**: Contact information and metadata
- **companies**: Company/business relationship data
- **licenses**: Dispensary license tracking
- **profiles**: Extended user profile information

### Security
- Row Level Security (RLS) enabled on all tables
- User-based data isolation
- Secure API endpoints with proper authorization

## Styling Guidelines

### Catalyst Design System
- Use semantic design tokens instead of direct colors
- Consistent spacing and typography scale
- Responsive design patterns
- Dark/light mode support

### Example Usage
```tsx
// ✅ Good - Using design system
<Button variant="primary" size="lg">
  Action Button
</Button>

<Heading level={1}>Page Title</Heading>
<Text>Supporting description text</Text>

// ❌ Avoid - Direct styling
<button className="bg-blue-500 text-white px-4 py-2">
  Action Button
</button>
```

## Testing Strategy

### Smoke Tests
- Component import validation
- Basic functionality checks
- Type safety verification
- Authentication flow testing

### Test Files
- `src/tests/smoke.test.ts`: Core application smoke tests
- `src/tests/setup.ts`: Test environment configuration

## Performance Considerations

### Optimization Techniques
- **React Query**: Efficient server state management
- **Code Splitting**: Lazy loading for route components
- **Memoization**: Strategic use of useMemo and useCallback
- **Virtual Scrolling**: For large data tables

### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npm run preview
```

## Deployment

### Build Process
```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

### Environment Variables
Create `.env.local` file with:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Common Development Tasks

### Adding a New Page
1. Create page component in `src/pages/`
2. Add route to `src/App.tsx`
3. Update navigation in `CatalystSidebar.tsx`
4. Add to breadcrumb mapping in `CatalystNavbar.tsx`

### Adding a New Data Table
1. Create table component extending `DataTable`
2. Define column configuration
3. Implement data fetching hook
4. Add filtering and sorting logic
5. Include export functionality

### Adding New Forms
1. Use Catalyst form components (`Field`, `Label`, `Input`)
2. Implement validation with proper error handling
3. Add proper TypeScript types
4. Include loading and success states

## Troubleshooting

### Common Issues
- **TypeScript Errors**: Run `npm run type-check` for detailed diagnostics
- **Build Failures**: Check for missing dependencies or type issues
- **Auth Issues**: Verify Supabase configuration and RLS policies
- **Styling Issues**: Ensure proper Catalyst component usage

### Debug Tools
- React Developer Tools
- Supabase Dashboard for database inspection
- Browser DevTools for network and performance analysis