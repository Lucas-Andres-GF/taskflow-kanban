import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false, // We'll use custom base styles
    }),
  ],
  // Configure prefetch for faster navigation
  prefetch: {
    defaultStrategy: 'viewport',
  },
});