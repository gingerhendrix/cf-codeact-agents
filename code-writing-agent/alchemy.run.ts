import { DurableObjectNamespace, Vite, WorkerLoader } from "alchemy/cloudflare"
import alchemy from "alchemy";

export const app = await alchemy("cf-code-act-agent");

function Agent(name: string) {
	return DurableObjectNamespace(name, {
		className: name,
		sqlite: true,
	});
}
export const website = await Vite("web", {
	entrypoint: "src/server.ts",
	compatibility: "node",
	bindings: { 
		SimpleAgent: Agent("SimpleAgent"),
		FetchAgent: Agent("FetchAgent"),
		LOADER: WorkerLoader(),
	},
	env: {
		OPENAI_API_KEY: process.env.OPENAI_API_KEY,
		GATEWAY_BASE_URL: process.env.GATEWAY_BASE_URL,
		GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
	},
});

console.log("App running at", website.url);
