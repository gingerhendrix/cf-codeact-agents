import type { Fetcher, WorkerLoader } from "@cloudflare/workers-types";

type CodeExecutorOptions = {
  globalOutbound?: Fetcher | null;
};

export class CodeExecutor {
  constructor(
    private loader: WorkerLoader,
    private opts: CodeExecutorOptions = {},
  ) {}
  async executeCode(code: string): Promise<string> {
    try {
      const id = crypto.randomUUID();
      const worker = this.loader.get(id, async () => {
        return {
          compatibilityDate: "2025-06-01",
          mainModule: "foo.js",
          modules: {
            "foo.js":
              "export default {\n" +
              "  async fetch(req, env, ctx) {\n" +
              "    async function agentDefinedFunction() {\n" +
              code +
              "    }\n" +
              "  return Response.json(await agentDefinedFunction());\n" +
              "  }\n" +
              "}\n",
          },
          globalOutbound: this.opts.globalOutbound,
        };
      });

      const defaultEntrypoint = worker.getEntrypoint();
      const response = await defaultEntrypoint.fetch("http://example.com");
      return response.text();
    } catch (error) {
      console.error("Error executing code:", error);
      return `Error executing code: ${error}`;
    }
  }
}
