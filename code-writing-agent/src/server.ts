import { routeAgentRequest } from "agents";

export { SimpleAgent } from "./server/agents/simple-agent.js";
export { FetchAgent } from "./server/agents/fetch-agent.js";

/**
 * Worker entry point that routes incoming requests to the appropriate handler
 */
export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
    return (
      // Route the request to our agent or return 404 if not found
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
