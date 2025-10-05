export class CodeExecutor {
  constructor(private loader: WorkerLoader) {}
  async executeCode(code: string): Promise<string> {
    try {
      const id = crypto.randomUUID();
      let worker = this.loader.get(id, async () => {
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
