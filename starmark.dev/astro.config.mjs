import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starmark from 'starmark-integration';

// https://astro.build/config
export default defineConfig({
  site: 'https://starmark.dev',
  integrations: [
    starlight({
      title: 'StarMark',
      description: 'Feedback collection for Astro documentation sites',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/yourusername/astro-starmark',
        },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', link: '/' },
            { label: 'Quick Start', link: '/getting-started/quick-start/' },
            { label: 'Installation', link: '/getting-started/installation/' },
          ],
        },
        {
          label: 'Configuration',
          items: [
            { label: 'Basic Setup', link: '/configuration/basic-setup/' },
            { label: 'Linear Integration', link: '/configuration/linear/' },
            { label: 'Auth0 Integration', link: '/configuration/auth0/' },
          ],
        },
        {
          label: 'API Reference',
          items: [
            { label: 'Integration Options', link: '/reference/options/' },
            { label: 'Components', link: '/reference/components/' },
          ],
        },
      ],
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
  output: 'static', // For now, we'll use static output for milestone 1
  build: {
    inlineStylesheets: 'auto',
  },
  typescript: {
    checkJs: true,
  },
}); 