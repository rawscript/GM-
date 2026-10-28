import { defineConfig } from 'vite';
import { readFile } from 'node:fs/promises';

function includes() {
  return {
    name: 'gm-build-includes',
    enforce: 'pre',
    async transformIndexHtml(html) {
      const pattern = /<!--\s*include:([a-z0-9/_-]+)\s*-->/gi;
      let output = html;
      for (const match of html.matchAll(pattern)) {
        const partial = await readFile(new URL(`./src/shared/partials/${match[1]}.html`, import.meta.url), 'utf8');
        output = output.replace(match[0], partial);
      }
      return output;
    }
  };
}

export default defineConfig({
  plugins: [includes()],
  server: {
    proxy: {
      '/api': {
        target: process.env.GM_PLATFORM_URL || 'http://127.0.0.1:8082',
        changeOrigin: true,
      },
    },
  },
  build: { target: 'es2022' },
});
