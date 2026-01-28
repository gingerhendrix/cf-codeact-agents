import alchemy from "alchemy";
import { AccountApiToken, Ai, AiGateway, DurableObjectNamespace, Vite, Worker, WorkerLoader } from "alchemy/cloudflare";

export const app = await alchemy("cf-code-act-agent", {
  password: process.env.ALCHEMY_SECRET,
});

const ai = Ai()

export const gateway = await AiGateway("ai-gateway", {
  gatewayName: "cf-code-act-agent",
	authentication: true,
	collectLogs: true,
})

//export const gatewayToken = await AccountApiToken("gateway-token", {
	//policies: [
		//{
			//effect: "allow",
			//permissionGroups: ["AI Gateway Read"],
			//resources: {
				//"com.cloudflare.api.account.zone.*": "*",
			//},
		//},
	//],
//});

function Agent(name: string) {
	return DurableObjectNamespace(name, {
		className: name,
		sqlite: true,
	});
}

export const loggingOutbound = await Worker("logging-outbound", {
	entrypoint: "src/server/outbound/logging.ts",
	url: false,
});


const gatewayBaseUrl = `https://gateway.ai.cloudflare.com/v1/${process.env.CLOUDFLARE_ACCOUNT_ID}/${gateway.id}`

export const website = await Vite("web", {
	entrypoint: "src/server.ts",
	compatibility: "node",
	bindings: { 
		LOADER: WorkerLoader(),
		AI: ai,
		GATEWAY_ID: gateway.id,
		GATEWAY_BASE_URL: gatewayBaseUrl,
		//GATEWAY_TOKEN: gatewayToken.secretAccessKey,
		GATEWAY_TOKEN: alchemy.secret(process.env.CLOUDFLARE_API_TOKEN),
		OPENAI_API_KEY: alchemy.secret(process.env.OPENAI_API_KEY),
		GOOGLE_GENERATIVE_AI_API_KEY: alchemy.secret(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
		// Agents
		SimpleAgent: Agent("SimpleAgent"),
		FetchAgent: Agent("FetchAgent"),
		// Outbounds
		LoggingOutbound: loggingOutbound,
	},
});

export type WorkerEnv = typeof website.Env

console.log("App running at", website.url);
