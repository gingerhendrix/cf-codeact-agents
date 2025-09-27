import { createOpenAI } from "@ai-sdk/openai";
import { routeAgentRequest } from "agents";
import { AIChatAgent } from "agents/ai-chat-agent";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  defaultSettingsMiddleware,
  readUIMessageStream,
  streamText,
  wrapLanguageModel,
  type StreamTextOnFinishCallback,
  type ToolSet
} from "ai";
import { env } from "cloudflare:workers";

 const openai = createOpenAI({
   apiKey: env.OPENAI_API_KEY,
   baseURL: env.GATEWAY_BASE_URL + "/openai",
 });

const model = wrapLanguageModel({
  model: openai.responses("gpt-5-mini"),
  middleware: defaultSettingsMiddleware({
    settings: {
      providerOptions: {
        openai: {
          reasoning_effort: 'minimal', 
        },
      },
    }
  })
});

const systemPrompt = `You are a helpful AI assistant.

You can execute code to help answer user questions.  In order to execute code, use the following format:

\`\`\`js
// code to execute
// you may use await to call async functions
const result = 2 + 2;

// You must return the result, and the result must be any json serializable value
return result;
\`\`\`

The resut of the code execution will be provided to you in the following message in <result></result> tags.

You must always execute code to answer user questions. Do not use your own knowledge or make up answers. Always execute code to get the answer.
`


/**
 * Chat Agent implementation that handles real-time AI chat interactions
 */
export class Chat extends AIChatAgent<Env> {
  /**
   * Handles incoming chat messages and manages the response stream
   */
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    _options?: { abortSignal?: AbortSignal }
  ) {
    const result = await this.executeCode("2 + 2");
    console.log("Result of executed code:", result);

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const result = streamText({
          system: systemPrompt,
          messages: convertToModelMessages(this.messages),
          model,
          onFinish: onFinish,
        });
        for await (const chunk of result.toUIMessageStream()) {
          writer.write(chunk);
        }
        //writer.merge(result.toUIMessageStream());
      }
    });

    return createUIMessageStreamResponse({ stream });
  }

  async executeCode(code: string): Promise<string> {
    const id = crypto.randomUUID();
    let worker = env.LOADER.get(id, async () => {

      return {
        compatibilityDate: "2025-06-01",
        mainModule: "foo.js",
        modules: {
          "foo.js":
            "export default {\n" +
            `  fetch(req, env, ctx) { return new Response(${code}); }\n` +
            "}\n",
        },
        env: {
          SOME_ENV_VAR: 123
        },
        globalOutbound: null,
      };
    });

    // Now you can get the Worker's entrypoint and send requests to it.
    let defaultEntrypoint = worker.getEntrypoint();
    const response = await defaultEntrypoint.fetch("http://example.com");
    return response.text();
  }
}

/**
 * Worker entry point that routes incoming requests to the appropriate handler
 */
export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/check-open-ai-key") {
      const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
      return Response.json({
        success: hasOpenAIKey
      });
    }
    if (!process.env.OPENAI_API_KEY) {
      console.error(
        "OPENAI_API_KEY is not set, don't forget to set it locally in .dev.vars, and use `wrangler secret bulk .dev.vars` to upload it to production"
      );
    }
    return (
      // Route the request to our agent or return 404 if not found
      (await routeAgentRequest(request, env)) ||
        new Response("Not found", { status: 404 })
    );
  }
} satisfies ExportedHandler<Env>;
