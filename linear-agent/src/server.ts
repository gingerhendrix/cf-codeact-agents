import { createOpenAI } from "@ai-sdk/openai";
import { routeAgentRequest } from "agents";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  defaultSettingsMiddleware,
  readUIMessageStream,
  streamText,
  wrapLanguageModel,
  type ModelMessage,
  type StreamTextOnFinishCallback,
  type ToolSet,
  type UserModelMessage
} from "ai";
import { env, WorkerEntrypoint } from "cloudflare:workers";
import { AIChatAgent } from "./server/ai-chat-agent";

 const openai = createOpenAI({
   apiKey: env.OPENAI_API_KEY,
   baseURL: env.GATEWAY_BASE_URL + "/openai",
 });

const model = wrapLanguageModel({
  model: openai.responses("gpt-5"),
  middleware: defaultSettingsMiddleware({
    settings: {
      providerOptions: {
        openai: {
          reasoning_effort: 'medium', 
        },
      },
    }
  })
});

const systemPrompt = `You are a helpful code execution assistant. 

When given a user question, if it is possible to answer it by executing code, do so by writing a code snippet in a single JavaScript code block. Your code may use await and async functions.

\`\`\`js
const result = 2 + 2;

// You must return the result, the result must be any json serializable value
return result;
\`\`\`

The next reply to your message will contain the result of your code execution, which you can use to help answer the user's question.  Reply to the user with plain text - do not use a code block for your answer.
`

function parseCode(text: string): string | null {
  const lines = text.split("\n");
  const codeStart = lines.findIndex(line => line.trim().includes("```js"));
  const codeEnd = lines.findIndex((line, index) => index > codeStart && line.trim().includes("```"));
  if (codeStart === -1 || codeEnd === -1 || codeEnd <= codeStart) {
    return null;
  }
  const code = lines.slice(codeStart + 1, codeEnd).join("\n");
  return code;
}

export class FetchProxy extends WorkerEntrypoint {
  fetch(request: Request): Promise<Response> {
    console.log("FetchProxy received request:", request.url);
    return fetch(request);
  }
}

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
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const generate = async (messages: ModelMessage[]) => {
          console.log("Generating with messages:", messages);
          const result = streamText({
            system: systemPrompt,
            messages,
            model,
          });
          for await (const chunk of result.toUIMessageStream()) {
            if (chunk.type == "finish") {
              writer.write({ ...chunk, type: "finish-step" });
            } else {
              writer.write(chunk);
            }
          }
          return result;
        }
 
        let continueGenerating = true;
        let messages = convertToModelMessages(this.messages);
        while (continueGenerating) {
          const response = await generate(messages);
          const text = await response.text;
          console.log("Generated text:", text);
          const code = parseCode(text);
          if (code) {
            console.log("Executing code:", code);
            const result = await this.executeCode(code);
            console.log("Code execution result:", result);
            const message = `<result>${result}</result>`;
            messages.push(
              ...(await response.response).messages,
            {
              role: "user",
              content: message,
            });
            writer.write({ type: "data-result", data: { result, message } });
          } else {
            console.log("No code found, finishing.");
            writer.write({ type: "finish" });
            continueGenerating = false;
          }
        }
      }
    });

    return createUIMessageStreamResponse({ stream });
  }

  async executeCode(code: string): Promise<string> {
    try {
      const id = crypto.randomUUID();
      let worker = env.LOADER.get(id, async () => {

        return {
          compatibilityDate: "2025-06-01",
          mainModule: "foo.js",
          modules: {
            "foo.js":
              "import { value } from '@test/module';\n" +
              "\n" +
              "export default {\n" +
              "  async fetch(req, env, ctx) {\n" +
              "    async function agentDefinedFunction() {\n" +
              code +
              "    }\n" +
              "  return Response.json(await agentDefinedFunction());\n" +
              "  }\n" +
              "}\n",
            "@test/module": `export const value = 42;`,
          },
          env: {
            SOME_ENV_VAR: 123,
            BROWSER: env.BROWSER,
          },
          globalOutbound: this.env.FETCH_PROXY,
          //globalOutbound: null,
        };
      });

      // Now you can get the Worker's entrypoint and send requests to it.
      let defaultEntrypoint = worker.getEntrypoint();
      const response = await defaultEntrypoint.fetch("http://example.com");
      return response.text();
    } catch (error) {
      console.error("Error executing code:", error);
      return `Error executing code: ${error}`;
    }
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
