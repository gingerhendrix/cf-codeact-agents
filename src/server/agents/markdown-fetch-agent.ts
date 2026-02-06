import type { AgentContext } from "agents";
import type { WorkerEnv } from "#alchemy.run";
import { BaseExecutionChatAgent } from "../base-execution-chat-agent";
import { CodeExecutor } from "../code-executor";

const systemPrompt = `You are a helpful code execution assistant.

You can execute JavaScript code using the executeCode tool. Your code may use await and async functions, and should return a JSON-serializable value.

You should use the fetch API to make HTTP requests. You have full access to the internet and should use it to answer user questions when needed.

Example: to fetch weather data, call executeCode with:
  language: "js"
  code: "const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=51.5&longitude=-0.12&hourly=temperature_2m'); return response.json();"

For news you might use RSS feeds from reliable sources. Here are some examples of RSS feeds you can use:

BBC Feeds
https://feeds.bbci.co.uk/news/rss.xml?edition=uk (or ?edition=int).

CNN (Top stories & sections)
Examples: https://rss.cnn.com/rss/cnn_topstories.rss and https://rss.cnn.com/rss/edition.rss.

NPR (multiple topical feeds)
Examples: https://feeds.npr.org/1001/rss.xml (News), https://feeds.npr.org/1003/rss.xml (National), https://feeds.npr.org/1004/rss.xml (World).

Al Jazeera (all news)
https://www.aljazeera.com/xml/rss/all.xml
`;

export class FetchAgent extends BaseExecutionChatAgent {
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
