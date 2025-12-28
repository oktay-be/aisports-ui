/**
 * MSW server setup for Node.js (test environment).
 *
 * This server intercepts HTTP requests during tests and returns mock responses.
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Create the mock server with default handlers
export const server = setupServer(...handlers);
