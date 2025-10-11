import type { WorkerEnv } from "#alchemy.run";

/* Global Outbound handler that logs all outbound requests
 *
 */
export default {
  async fetch(request: Request, _env: WorkerEnv, _ctx: ExecutionContext) {
    console.log("Outbound request:", request.method, request.url);
    return fetch(request);
  },
} satisfies ExportedHandler<WorkerEnv>;
