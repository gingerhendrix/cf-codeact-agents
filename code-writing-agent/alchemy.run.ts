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
		ExecutionChat: Agent("ExecutionChatAgent"),
		SimpleAgent: Agent("SimpleChatAgent"),
		LOADER: WorkerLoader(),
	},
	env: {
		OPENAI_API_KEY: process.env.OPENAI_API_KEY,
		GATEWAY_BASE_URL: process.env.GATEWAY_BASE_URL,
	},
});

console.log("App running at", website.url);
