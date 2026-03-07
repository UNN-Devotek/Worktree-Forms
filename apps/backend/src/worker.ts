/**
 * BullMQ worker entrypoint.
 * Runs in a separate container (see docker-compose.yml `worker` service).
 * Registers all background job workers without starting the HTTP server.
 */
import 'dotenv/config';
import './jobs/workers/file-rename.worker.js';
import './jobs/workers/webhook-delivery.worker.js';

console.error('[worker] BullMQ workers started');
