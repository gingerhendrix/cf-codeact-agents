import type { WorkerEnv } from "#alchemy.run";

/**
 * Worker entry point that routes incoming requests to the appropriate handler
 */
export default {
  async fetch(request: Request, _env: WorkerEnv, _ctx: ExecutionContext) {
    return fetch(request);
  },
} satisfies ExportedHandler<WorkerEnv>;
