import {
  Agent,
  type AgentContext,
  type Connection,
  type WSMessage,
} from "agents";
import {
  type UIMessage,
  type UIMessageChunk,
  convertToModelMessages,
  generateId,
  readUIMessageStream,
  stepCountIs,
  streamText,
  tool,
} from "ai";
import { z } from "zod";
import type { WorkerEnv } from "#alchemy.run";
import type { CodeExecutor } from "./code-executor.js";
import {
  type IncomingMessage,
  InitResponse,
  type OutgoingMessage,
} from "./messages.js";
import { type AvailableModel, registry } from "./model-provider-registry.js";

type State = unknown;

export abstract class BaseExecutionChatAgent extends Agent<WorkerEnv, State> {
  messages: UIMessage[];
  model: AvailableModel;

  constructor(ctx: AgentContext, env: WorkerEnv) {
    super(ctx, env);
    this.sql`create table if not exists messages (
      id text primary key,
      message text not null,
      created_at datetime default current_timestamp
    )`;

    this.messages = (this.sql`select * from messages` || []).map((row) => {
      return JSON.parse(row.message as string);
    });
    this.model = "openai:gpt-5";
  }

  abstract codeExecutor(): CodeExecutor;

  abstract systemPrompt(): string;

  override async onMessage(connection: Connection, message: WSMessage) {
    if (typeof message === "string") {
      let data: IncomingMessage;
      try {
        data = JSON.parse(message) as IncomingMessage;
      } catch (error) {
        console.error("Failed to parse incoming message:", error);
        return;
      }
      if (data.type === "init") {
        await this.handleInit(connection);
      } else if (data.type === "send_message") {
        await this.handleSendMessage(connection, data.message);
      } else if (data.type === "clear_messages") {
        await this.handleClearMessages();
      } else if (data.type === "set_model") {
        this.model = data.model as AvailableModel;
        this.broadcast(
          JSON.stringify({
            type: "model_changed",
            model: this.model,
          }),
        );
      } else {
        const unknown: never = data;
        console.error("Unknown message type:", unknown);
      }
    } else {
      console.error("Received non-string message:", message);
      return;
    }
  }

  private async handleClearMessages() {
    this.messages = [];
    this.sql`delete from messages`;
    const outgoing: OutgoingMessage = {
      type: "messages_cleared",
    };
    this.broadcast(JSON.stringify(outgoing));
  }

  async handleSendMessage(_connection: Connection, message: string) {
    const userMessage: UIMessage = {
      id: generateId(),
      role: "user",
      parts: [{ type: "text", text: message }],
    };
    this.pushMessage(userMessage);
    await this.generate();
  }

  private async generate() {
    console.log("Using model:", this.model);

    const executor = this.codeExecutor();

    const result = streamText({
      system: this.systemPrompt(),
      model: registry.languageModel(this.model),
      messages: convertToModelMessages(this.messages),
      tools: {
        executeCode: tool({
          description:
            "Execute JavaScript code in a sandboxed environment. The code can use async/await and should return a JSON-serializable value.",
          inputSchema: z.object({
            language: z.string().describe("The programming language (js)"),
            code: z
              .string()
              .describe("The JavaScript code to execute"),
          }),
          execute: async ({ code }) => {
            return await executor.executeCode(code);
          },
        }),
      },
      stopWhen: stepCountIs(10),
    });

    // Get the UIMessage stream and tee it: one for broadcasting, one for building the final message
    const uiStream = result.toUIMessageStream();
    const [broadcastStream, readStream] = uiStream.tee();

    // Start reading the final message in parallel
    const messageReader = readUIMessageStream({ stream: readStream });

    // Broadcast each chunk to all connected clients
    const reader = broadcastStream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        this.broadcastChunk(value);
      }
    } finally {
      reader.releaseLock();
    }

    // Get the final assembled UIMessage from readUIMessageStream
    let finalMessage: UIMessage | undefined;
    for await (const msg of messageReader) {
      finalMessage = msg;
    }

    if (finalMessage) {
      this.pushMessage(finalMessage);
      this.broadcastNewMessage(finalMessage);
    }
  }

  async handleInit(connection: Connection) {
    this._reply(connection, InitResponse(this.messages, this.model));
  }

  private _reply(connection: Connection, message: OutgoingMessage) {
    connection.send(JSON.stringify(message));
  }

  private pushMessage(message: UIMessage) {
    this.messages.push(message);
    this
      .sql`insert into messages (id, message) values (${message.id}, ${JSON.stringify(message)})`;
  }

  private broadcastNewMessage(message: UIMessage) {
    const outgoing: OutgoingMessage = {
      type: "new_message",
      message,
    };
    this.broadcast(JSON.stringify(outgoing));
  }

  private broadcastChunk(chunk: UIMessageChunk) {
    const outgoing: OutgoingMessage = {
      type: "StreamEvent",
      event: chunk,
    };
    this.broadcast(JSON.stringify(outgoing));
  }
}
