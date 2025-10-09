import { env as cloudflareEnv } from "cloudflare:workers";
import type { WorkerEnv } from "#alchemy.run";

declare global {
  type Env = WorkerEnv;
}

declare module "cloudflare:workers" {
  namespace Cloudflare {
    export interface Env extends WorkerEnv {}
  }
}

export const env: WorkerEnv = cloudflareEnv;
