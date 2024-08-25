/**
 * @license
 * Copyright © 2026 Ashraf Morningstar
 * https://github.com/AshrafMorningstar
 * 
 * Licensed under the MIT License.
 * This is a personal educational recreation.
 * Original concepts remain property of their respective creators.
 * 
 * @author Ashraf Morningstar
 * @see https://github.com/AshrafMorningstar
 */
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
