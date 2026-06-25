import type { ServerEnv } from "@/config/env";

declare global {
  namespace NodeJS {
    interface ProcessEnv extends ServerEnv {}
  }
}

export {};
