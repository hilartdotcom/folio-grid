# Package.json Scripts Reference

**Note**: Since package.json cannot be directly modified in this environment, these are the recommended scripts to add to your package.json file.

## Recommended Scripts

Add these scripts to your `package.json` file in the `"scripts"` section:

```json
{
  "scripts": {
    // Development
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    
    // Code Quality
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0 --fix",
    
    // Testing
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    
    // Database
    "db:types": "supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts",
    
    // Utilities
    "clean": "rm -rf dist node_modules/.vite",
    "deps:update": "npm update",
    "deps:check": "npm outdated"
  }
}
```

## Required Dependencies

Add these dev dependencies for the scripts to work:

```bash
# Testing
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom

# ESLint (if not already installed)
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh

# Additional utilities
npm install -D @types/node
```

## Script Descriptions

### Development Scripts
- **`dev`**: Starts the Vite development server with hot reload
- **`build`**: Creates a production build with TypeScript compilation
- **`preview`**: Serves the production build locally for testing
- **`type-check`**: Runs TypeScript compiler without emitting files (type checking only)

### Code Quality Scripts
- **`lint`**: Runs ESLint on all TypeScript and TSX files
- **`lint:fix`**: Runs ESLint and automatically fixes issues where possible

### Testing Scripts
- **`test`**: Runs all tests once
- **`test:watch`**: Runs tests in watch mode (re-runs on file changes)
- **`test:ui`**: Opens Vitest UI for interactive testing
- **`test:coverage`**: Runs tests and generates coverage report

### Database Scripts
- **`db:types`**: Generates TypeScript types from your Supabase schema

### Utility Scripts
- **`clean`**: Removes build artifacts and cache files
- **`deps:update`**: Updates all dependencies to their latest versions
- **`deps:check`**: Shows outdated dependencies

## Usage Examples

```bash
# Start development
npm run dev

# Build for production
npm run build

# Run linting and fix issues
npm run lint:fix

# Run tests in watch mode during development
npm run test:watch

# Check for type errors without building
npm run type-check

# Generate fresh database types
npm run db:types

# Clean and reinstall dependencies
npm run clean && npm install
```

## CI/CD Integration

These scripts are designed to work well with CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
steps:
  - name: Install dependencies
    run: npm ci
    
  - name: Type check
    run: npm run type-check
    
  - name: Lint
    run: npm run lint
    
  - name: Test
    run: npm run test
    
  - name: Build
    run: npm run build
```

## Pre-commit Hooks

Consider adding these scripts to your pre-commit hooks:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npm run type-check && npm run test"
    }
  }
}
```