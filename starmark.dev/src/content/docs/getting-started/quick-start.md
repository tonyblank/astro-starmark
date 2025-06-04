---
title: Quick Start
description: Get StarMark running on your Astro site in 5 minutes
---

# Quick Start

This guide will help you add StarMark to your Astro documentation site in just a few minutes.

## Installation

Install StarMark using your preferred package manager:

```bash
npm install starmark-integration
```

## Basic Setup

Add StarMark to your Astro configuration:

```js
import { defineConfig } from "astro/config";
import starmark from "starmark-integration";

export default defineConfig({
  integrations: [
    starmark({
      ui: {
        categories: ["Bug", "Feature Request", "Question"],
      },
    }),
  ],
});
```

That's it! A feedback widget will appear on your site.

## Prerequisites

- An existing Astro project
- Node.js 18+ and pnpm/npm
- (Optional) Linear account for feedback collection

## For Starlight Sites

If you're using Starlight, the integration works seamlessly:

```js title="astro.config.mjs"
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starmark from "starmark-integration";

export default defineConfig({
  integrations: [
    starlight({
      title: "My Docs",
      // ... your starlight config
    }),
    starmark({
      ui: {
        categories: ["Bug", "Documentation Issue", "Feature Request"],
      },
    }),
  ],
});
```

## Test Your Setup

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Visit your site at `http://localhost:4321`

3. Look for the feedback widget in the bottom-right corner

4. Click it to test the feedback form (it won't submit anywhere yet, but should open without errors)

## Next Steps

- [Configure Linear integration](/configuration/linear/) to start receiving feedback
- [Customize the UI](/configuration/basic-setup/) to match your site's design
- [Set up user authentication](/configuration/auth0/) for better feedback context

## Troubleshooting

### Widget Not Appearing

1. Check that the integration is properly added to your `astro.config.mjs`
2. Ensure you've restarted your dev server after adding the integration
3. Check the browser console for any JavaScript errors

### Build Errors

1. Make sure you're using Node.js 18 or higher
2. Clear your build cache: `rm -rf dist .astro node_modules/.cache`
3. Reinstall dependencies: `npm install`

Still having issues? Feel free to use the feedback widget on this page to report problems!
