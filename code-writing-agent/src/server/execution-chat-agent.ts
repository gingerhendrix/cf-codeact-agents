import { createOpenAI } from "@ai-sdk/openai";
import {
  Agent,
  type AgentContext,
  type Connection,
  type WSMessage,
} from "agents";
import {
  defaultSettingsMiddleware,
  streamText,
  wrapLanguageModel,
  type LanguageModel,
  type ModelMessage,
} from "ai";
import {
  InitResponse,
  type IncomingMessage,
  type OutgoingMessage,
  type StreamPart,
} from "./messages.js";
import { CodeExecutor } from "./code-executor.js";
import { parseCode } from "./utils/parseCode.js";

type State = unknown;

const systemPrompt = `You are a helpful code execution assistant. 

When given a user question, if it is possible to answer it by executing code, do so by writing a code snippet in a single JavaScript code block. Your code may use await and async functions.

\`\`\`js
const result = 2 + 2;

// You must return the result, the result must be any json serializable value
return result;
\`\`\`

The next reply to your message will contain the result of your code execution, which you can use to help answer the user's question.  Reply to the user with plain text - do not use a code block for your answer.
`;

export class ExecutionChatAgent extends Agent<Env, State> {
  messages: ModelMessage[];
  model: LanguageModel;
  codeExecutor: CodeExecutor;

  constructor(ctx: AgentContext, env: Env) {
    super(ctx, env);
    this.sql`create table if not exists messages (
      id text primary key,
      message text not null,
      created_at datetime default current_timestamp
    )`;

    this.messages = (this.sql`select * from messages` || []).map((row) => {
      return JSON.parse(row.message as string);
    });
    this.codeExecutor = new CodeExecutor(env.LOADER);

    const openai = createOpenAI({
      apiKey: env.OPENAI_API_KEY,
      baseURL: env.GATEWAY_BASE_URL + "/openai",
    });

    this.model = wrapLanguageModel({
      model: openai.responses("gpt-5"),
      middleware: defaultSettingsMiddleware({
        settings: {
          providerOptions: {
            openai: {
              reasoning_effort: "medium",
            },
          },
        },
      }),
    });
  }

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
        await this.hnandleClearMessages();
      } else {
        const unknown: never = data;
        console.error("Unknown message type:", unknown);
      }
    } else {
      console.error("Received non-string message:", message);
      return;
    }
  }

  private async hnandleClearMessages() {
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
      console.log("Agent loop iteration with messages:", this.messages.length);
      const result = await this.generate(this.messages);
      const response = await result.response;
      for (const msg of response.messages) {
        this.pushMessage(msg);
      }
      const text = await result.text;
      const code = parseCode(text);
      console.log("Parsed code:", code);
      if (code) {
        const executionResult = await this.codeExecutor.executeCode(code);
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
    const result = streamText({
      system: systemPrompt,
      model: this.model,
      messages,
    });
    for await (const part of result.fullStream) {
      this.broadcastPart(part);
    }
    return result;
  }

  async handleInit(connection: Connection) {
    this._reply(connection, InitResponse(this.messages));
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
