/**
 * Worker entry point that routes incoming requests to the appropriate handler
 */
export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
    return fetch(request);
  },
} satisfies ExportedHandler<Env>;
