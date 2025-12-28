import path from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Vitest configuration for aisports-ui tests.
 *
 * Features:
 * - React Testing Library integration
 * - jsdom for DOM simulation
 * - Coverage reporting with v8
 * - Path aliases matching vite.config.ts
 */

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
        'services/**/*.{ts,tsx}',
      ],
      exclude: [
        'node_modules',
        'tests',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/types/**',
      ],
      thresholds: {
        lines: 60,
        branches: 50,
        functions: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
