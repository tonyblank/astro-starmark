# StarMark.dev Deployment Guide

## Cloudflare Pages Deployment

This project is configured to deploy to Cloudflare Pages with server-side rendering enabled via the `@astrojs/cloudflare` adapter.

### Prerequisites

1. Cloudflare account
2. Wrangler CLI installed: `npm install -g wrangler`

### Setup Instructions

1. **Create KV Namespaces** (for session management):
   ```bash
   # Production namespace
   wrangler kv namespace create SESSION --preview false
   
   # Development namespace  
   wrangler kv namespace create SESSION --preview
   ```

2. **Update wrangler.toml** with the actual KV namespace IDs:
   ```toml
   [[kv_namespaces]]
   binding = "SESSION"
   id = "your_production_namespace_id"
   preview_id = "your_preview_namespace_id"
   ```

3. **Deploy to Cloudflare Pages**:
   ```bash
   # Build and deploy
   pnpm build
   wrangler pages deploy dist
   ```

### Features Enabled

- ✅ **Server-side rendering** for API routes (`/api/*`)
- ✅ **Static page pre-rendering** for documentation
- ✅ **KV storage** for session management
- ✅ **Cloudflare Workers** runtime for backend functionality

### Environment Variables (Optional)

Set these in the Cloudflare dashboard for full functionality:

- `LINEAR_API_KEY` - For Linear integration
- `LINEAR_TEAM_ID` - Linear team identifier  
- `AUTH0_DOMAIN` - Auth0 domain
- `AUTH0_CLIENT_ID` - Auth0 client ID
- `AUTH0_CLIENT_SECRET` - Auth0 client secret

### Local Development

```bash
# Start local development with KV
wrangler pages dev dist --kv=SESSION
```

The site will be available at `http://localhost:8788` with full Cloudflare runtime simulation. 