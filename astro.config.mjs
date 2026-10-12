// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import { rm } from 'node:fs/promises';

// https://astro.build/config
export default defineConfig({
  integrations: [
    svelte(),
    {
      name: 'exclude-local-fonts',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          await rm(new URL('__font/', dir), { recursive: true, force: true });
        },
      },
    },
  ],

  vite: {
    plugins: [tailwindcss()]
  }
});
