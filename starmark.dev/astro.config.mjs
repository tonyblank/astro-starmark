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
      social: {
        github: 'https://github.com/yourusername/astro-starmark',
      },
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
            { label: 'Configuration Options', link: '/api/configuration/' },
            { label: 'Events', link: '/api/events/' },
          ],
        },
        {
          label: 'Examples',
          items: [
            { label: 'Basic Example', link: '/examples/basic/' },
            { label: 'Custom Theme', link: '/examples/custom-theme/' },
          ],
        },
      ],
    }),
    // Include StarMark integration for dogfooding
    starmark({
      debug: true,
      ui: {
        categories: ['Bug', 'Feature Request', 'Documentation', 'Question'],
        position: 'bottom-right',
      },
    }),
  ],
  output: 'static', // For now, we'll use static output for milestone 1
}); 