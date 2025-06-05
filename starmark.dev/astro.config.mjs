import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starmark from 'starmark-integration';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://starmark.dev',
  adapter: cloudflare(),
  devToolbar: {
    enabled: process.env.NODE_ENV !== 'test' && !process.env.PLAYWRIGHT_TEST
  },
  integrations: [
    starlight({
      title: 'StarMark',
      description: 'Feedback collection for Astro documentation sites',
      favicon: '/favicon.svg',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/tonyblank/astro-starmark',
        },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', link: '/' },
            { label: 'Quick Start', link: '/getting-started/quick-start/' },
          ],
        },
      ],
      components: {
        Footer: './src/components/Footer.astro',
      },
    }),
    starmark({
      linear: {
        apiKey: process.env.LINEAR_API_KEY || '',
        teamId: process.env.LINEAR_TEAM_ID || '',
      },
      auth0: {
        domain: process.env.AUTH0_DOMAIN || '',
        clientId: process.env.AUTH0_CLIENT_ID || '',
        clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
      },
      ui: {
        position: 'bottom-right',
        theme: { 
          primary: '#3b82f6',
          background: '#ffffff' 
        },
        showAvatar: true,
      },
      debug: true,
    }),
  ],
  output: 'server', // Enable API routes for Milestone 4 feedback submission
  build: {
    inlineStylesheets: 'auto',
  },
  typescript: {
    checkJs: true,
  },
}); 