import type { AgentContext } from "agents";
import { CodeExecutor } from "../code-executor";
import { BaseExecutionChatAgent } from "../base-execution-chat-agent";

const systemPrompt = `You are a helpful code execution assistant. 

When given a user question, if it is possible to answer it by executing code, do so by writing a code snippet in a single JavaScript code block. Your code may use await and async functions.

\`\`\`js
const result = 2 + 2;

// You must return the result, the result must be any json serializable value
return result;
\`\`\`

The next reply to your message will contain the result of your code execution, which you can use to help answer the user's question.  Reply to the user with plain text - do not use a code block for your answer.
`;

export class SimpleAgent extends BaseExecutionChatAgent {
  private _codeExecutor: CodeExecutor;
  constructor(ctx: AgentContext, env: Env) {
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
