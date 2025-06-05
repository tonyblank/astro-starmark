# StarMark.dev Deployment Guide

## Cloudflare Pages Deployment

This project is configured to deploy to Cloudflare Pages with server-side rendering enabled via the `@astrojs/cloudflare` adapter.

### Prerequisites

1. Cloudflare account
2. Wrangler CLI installed: `npm install -g wrangler`

### Setup Instructions

1. **Create KV Namespaces** (for session management):
   ```bash
   # Production namespace - save the ID from output
   wrangler kv namespace create SESSION --preview false
   
   # Development namespace - save the ID from output
   wrangler kv namespace create SESSION --preview
   ```
   
   **Important**: Copy both namespace IDs from the command outputs - you'll need them in step 2!

2. **Update wrangler.toml** with the actual KV namespace IDs from step 1:
   
   Copy the namespace IDs from the output of step 1 and replace the placeholders:
   
   ```toml
   [[kv_namespaces]]
   binding = "SESSION"
   id = "your_production_namespace_id_from_step_1"
   preview_id = "your_preview_namespace_id_from_step_1"
   ```
   
   **Example**: If step 1 output was:
   ```
   ⛅️ wrangler 3.0.0
   Created namespace "SESSION" with id "a1b2c3d4-5678-90ab-cdef-1234567890ab"
   ```
   
   Then use that ID in your wrangler.toml:
   ```toml
   [[kv_namespaces]]
   binding = "SESSION"
   id = "a1b2c3d4-5678-90ab-cdef-1234567890ab"  # From production command
   preview_id = "x9y8z7w6-5432-10ba-dcfe-0987654321ba"  # From preview command
   ```

   **Alternative**: Use environment variables for better security (see `wrangler.toml.example` for setup):
   ```toml
   [[kv_namespaces]]
   binding = "SESSION"
   id = "${SESSION_KV_ID}"
   preview_id = "${SESSION_KV_PREVIEW_ID}"
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
# First, build the project
pnpm build

# Then start local development with KV
wrangler pages dev dist --kv=SESSION
```

The site will be available at `http://localhost:8788` with full Cloudflare runtime simulation.

**Note**: You need to rebuild (`pnpm build`) after making changes to see updates in the local Cloudflare environment. 