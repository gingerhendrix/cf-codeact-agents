import { routeAgentRequest } from "agents";
import type { website } from "../alchemy.run";

export { FetchAgent } from "./server/agents/fetch-agent.js";
export { SimpleAgent } from "./server/agents/simple-agent.js";

/**
 * Worker entry point that routes incoming requests to the appropriate handler
 */
export default {
  async fetch(
    request: Request,
    env: typeof website.Env,
    _ctx: ExecutionContext,
  ) {
    return (
      // Route the request to our agent or return 404 if not found
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  },
} satisfies ExportedHandler<typeof website.Env>;
