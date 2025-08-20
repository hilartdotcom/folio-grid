# Deployment Guide

## Quick Deploy with Lovable

The fastest way to deploy your cann.contact application:

1. **Open Lovable Project**: Visit your [Lovable project](https://lovable.dev/projects/81e9eb26-32e7-4eb9-bccb-629a0798e710)
2. **Click Share → Publish**: This will deploy your app automatically
3. **Custom Domain** (Optional): Go to Project > Settings > Domains to connect your own domain

## Manual Deployment Options

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Netlify

```bash
# Build the project
npm run build

# Drag and drop the 'dist' folder to Netlify
# Or use Netlify CLI:
npx netlify deploy --prod --dir dist
```

### GitHub Pages

```bash
# Add to package.json
"homepage": "https://yourusername.github.io/your-repo-name",

# Install gh-pages
npm install --save-dev gh-pages

# Add deploy script to package.json
"deploy": "npm run build && gh-pages -d dist"

# Deploy
npm run deploy
```

## Environment Variables

Ensure these environment variables are set in your deployment platform:

### Required Variables
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Platform-Specific Setup

#### Vercel
Add environment variables in:
- Vercel Dashboard → Project Settings → Environment Variables

#### Netlify
Add environment variables in:
- Netlify Dashboard → Site Settings → Environment Variables

#### GitHub Pages
For GitHub Pages, create `.env.production` file (not recommended for sensitive data):
```env
VITE_SUPABASE_URL=your_public_supabase_url
VITE_SUPABASE_ANON_KEY=your_public_anon_key
```

## Supabase Configuration

### Database Setup
1. **RLS Policies**: Ensure Row Level Security is enabled
2. **Authentication**: Configure auth providers and settings
3. **Edge Functions**: Deploy any custom functions
4. **Storage**: Set up file storage buckets if needed

### Production Checklist
- [ ] Enable RLS on all tables
- [ ] Review and test all security policies
- [ ] Set up proper indexes for performance
- [ ] Configure backup and recovery
- [ ] Set up monitoring and alerting

## Build Configuration

### Optimizing for Production

#### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@headlessui/react', 'framer-motion'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  }
});
```

#### Performance Optimizations
- Code splitting implemented
- Tree shaking enabled
- Bundle size optimization
- Asset optimization

## Monitoring and Analytics

### Error Tracking
Consider adding error tracking service:
- Sentry
- LogRocket
- Bugsnag

### Analytics
Add analytics tracking:
- Google Analytics
- Mixpanel
- PostHog

### Performance Monitoring
- Lighthouse CI
- Web Vitals
- Vercel Analytics

## Security Considerations

### HTTPS
- Always use HTTPS in production
- Redirect HTTP to HTTPS
- Set proper security headers

### Content Security Policy
Add to your `index.html`:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
```

### API Security
- Use environment variables for sensitive data
- Implement proper rate limiting
- Validate all user inputs
- Use Supabase RLS policies

## Backup Strategy

### Database Backups
- Supabase provides automatic backups
- Consider additional backup strategies for critical data
- Test restore procedures regularly

### Code Backups
- Use Git for version control
- Multiple remote repositories
- Regular commits and tags for releases

## Rollback Plan

### Quick Rollback
```bash
# Vercel
vercel rollback [deployment-url]

# Netlify  
netlify rollback

# Manual rollback
git revert [commit-hash]
npm run build
# Deploy previous version
```

### Database Migration Rollback
- Keep migration scripts versioned
- Test rollback procedures
- Have data backup before major changes

## Domain and SSL

### Custom Domain Setup
1. **Purchase Domain**: From registrar (Namecheap, GoDaddy, etc.)
2. **DNS Configuration**: Point to deployment platform
3. **SSL Certificate**: Automatic with most platforms
4. **Subdomain Setup**: For staging/development environments

### DNS Records
```
Type: A
Name: @
Value: [Platform IP]

Type: CNAME  
Name: www
Value: [Platform domain]
```

## Continuous Deployment

### GitHub Actions Example
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Post-Deployment

### Testing
- [ ] Authentication flow works
- [ ] Database connections established  
- [ ] All pages load correctly
- [ ] Forms submit successfully
- [ ] File uploads work (if applicable)
- [ ] Mobile responsiveness verified

### SEO Optimization
- [ ] Meta tags configured
- [ ] Sitemap generated
- [ ] Robots.txt configured
- [ ] Social media meta tags
- [ ] Analytics tracking active

### Support and Maintenance
- Monitor application performance
- Regular security updates
- Database maintenance
- User feedback collection
- Bug tracking and resolution