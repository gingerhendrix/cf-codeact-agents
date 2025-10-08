import type { website } from "../../alchemy.run";

declare global {
  export type CloudflareEnv = typeof website.Env;
}

declare module "cloudflare:workers" {
  namespace Cloudflare {
    export interface Env extends CloudflareEnv {}
  }
}
