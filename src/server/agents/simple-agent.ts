import type { AgentContext } from "agents";
import type { WorkerEnv } from "#alchemy.run";
import { BaseExecutionChatAgent } from "../base-execution-chat-agent";
import { CodeExecutor } from "../code-executor";

const systemPrompt = `You are a helpful code execution assistant.

When given a user question, if it is possible to answer it by executing code, use the executeCode tool. Your code may use await and async functions, and should return a JSON-serializable value.

Example: to compute 2 + 2, call executeCode with:
  language: "js"
  code: "const result = 2 + 2; return result;"

You will receive the result of the code execution, which you can use to help answer the user's question. Reply to the user with plain text after receiving the result.
`;

export class SimpleAgent extends BaseExecutionChatAgent {
  private _codeExecutor: CodeExecutor;
  constructor(ctx: AgentContext, env: WorkerEnv) {
    super(ctx, env);
    this._codeExecutor = new CodeExecutor(env.LOADER);
  }

  codeExecutor() {
    return this._codeExecutor;
  }

  systemPrompt() {
    return systemPrompt;
  }
}
