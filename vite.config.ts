import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Minimal Vite configuration for React app.
 *
 * For local development:
 * - Set VITE_GCS_API_URL in .env to point to either:
 *   - Local gcs_api_function: http://localhost:8080
 *   - Deployed gcs_api_function URL
 * - Set VITE_GCS_API_KEY if required
 * - Set VITE_GOOGLE_CLIENT_ID for authentication
 *
 * All API calls are handled by gcs_api_function via gcsApiService.ts
 */

export default defineConfig(({ mode }) => {
  // Load .env.test for test mode
  const envDir = mode === 'test' ? '.' : '.';
  const env = loadEnv(mode, envDir, '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './tests/setup.ts',
      env: {
        VITE_GCS_API_URL: 'http://localhost:8080',
        VITE_GCS_API_KEY: 'test-api-key',
      },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: ['services/**/*.ts', 'components/**/*.tsx'],
        exclude: ['**/*.test.ts', '**/*.test.tsx', '**/node_modules/**'],
        thresholds: {
          // High thresholds - maintained at 90%+ coverage
          lines: 90,
          functions: 90,
          branches: 80,
          statements: 90,
        },
      },
    }
  };
});
