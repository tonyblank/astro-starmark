# StarMark Documentation Site

This is the documentation and demo site for StarMark, built with Astro and Starlight.

## Development Setup

### Prerequisites
- Node.js 18+ and pnpm
- Cloudflare account (for deployment)

### Environment Configuration

**⚠️ IMPORTANT: Never commit actual Cloudflare IDs to git!**

This project uses environment variables to keep sensitive Cloudflare configuration out of version control.

#### 1. Set up Cloudflare KV Namespaces

```bash
# Create KV namespaces
pnpm wrangler kv:namespace create SESSION
pnpm wrangler kv:namespace create SESSION --preview
```

#### 2. Configure Environment Variables

Copy the example environment file and fill in your actual values:

```bash
# Copy the example file
cp env.example .env

# Edit .env with your actual Cloudflare KV namespace IDs
# (this file is gitignored for security)
```

#### 3. For CI/CD and Production

Set these environment variables in your deployment system:
- **Cloudflare Pages**: Set in Pages dashboard → Settings → Environment variables
- **GitHub Actions**: Set as repository secrets
- **Other CI systems**: Configure in your CI environment

### Local Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Deploy to Cloudflare Pages
pnpm deploy
```

### Security Notes

- The `wrangler.toml` file uses environment variable placeholders (`${VAR_NAME}`)
- See `wrangler.toml.example` for the complete configuration template
- Never commit actual Cloudflare IDs, API keys, or other secrets
- Use Wrangler's secret management for runtime secrets: `pnpm wrangler secret put SECRET_NAME`

## Project Structure

```
starmark.dev/
├── src/
│   ├── content/docs/     # Documentation content
│   └── pages/           # Site pages
├── wrangler.toml        # Cloudflare config (uses env vars)
├── wrangler.toml.example # Template with setup docs  
├── env.example          # Example environment variables
├── .env                 # Your actual env vars (gitignored)
└── astro.config.mjs     # Astro configuration
``` 