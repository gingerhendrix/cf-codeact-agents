import {
  Agent,
  type AgentContext,
  type Connection,
  type WSMessage,
} from "agents";
import { type ModelMessage, streamText } from "ai";
import type { WorkerEnv } from "#alchemy.run";
import type { CodeExecutor } from "./code-executor.js";
import {
  type IncomingMessage,
  InitResponse,
  type OutgoingMessage,
  type StreamPart,
} from "./messages.js";
import { type AvailableModel, registry } from "./model-provider-registry.js";
import { parseCode } from "./utils/parseCode.js";

type State = unknown;

export abstract class BaseExecutionChatAgent extends Agent<WorkerEnv, State> {
  messages: ModelMessage[];
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
    const userMessage: ModelMessage = {
      role: "user",
      content: message,
    };
    this.pushMessage(userMessage);
    await this.agentLoop();
  }

  private async agentLoop() {
    let continueLoop = true;
    while (continueLoop) {
      const result = await this.generate(this.messages);
      const response = await result.response;
      for (const msg of response.messages) {
        this.pushMessage(msg);
      }
      const text = await result.text;
      console.log("Generated text:", text);
      const code = parseCode(text);
      console.log("Parsed code:", code);

      if (code) {
        const executionResult = await this.codeExecutor().executeCode(code);
        const resultMessage: ModelMessage = {
          role: "user",
          content: `<result>${executionResult}</result>`,
        };
        this.pushMessage(resultMessage);
      } else {
        continueLoop = false;
      }
    }
  }

  private async generate(messages: ModelMessage[]) {
    console.log("Using model:", this.model);
    const result = streamText({
      system: this.systemPrompt(),
      model: registry.languageModel(this.model),
      messages,
    });
    for await (const part of result.fullStream) {
      this.broadcastPart(part);
    }
    return result;
  }

  async handleInit(connection: Connection) {
    this._reply(connection, InitResponse(this.messages, this.model));
  }

  private _reply(connection: Connection, message: OutgoingMessage) {
    connection.send(JSON.stringify(message));
  }

  private pushMessage(message: ModelMessage) {
    this.messages.push(message);
    this
      .sql`insert into messages (id, message) values (${crypto.randomUUID()}, ${JSON.stringify(message)})`;
    this.broadcastNewMessage(message);
  }

  private broadcastNewMessage(message: ModelMessage) {
    const outgoing: OutgoingMessage = {
      type: "new_message",
      message,
    };
    this.broadcast(JSON.stringify(outgoing));
  }

  private broadcastPart(part: StreamPart) {
    const outgoing: OutgoingMessage = {
      type: "StreamEvent",
      event: part,
    };
    this.broadcast(JSON.stringify(outgoing));
  }
}
