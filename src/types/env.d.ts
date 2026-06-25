// eslint-disable-next-line @typescript-eslint/no-empty-object-type
import type { ServerEnv } from "@/config/env";

declare global {
  namespace NodeJS {
    // Using interface merge to extend ProcessEnv with our typed env vars
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface ProcessEnv extends ServerEnv {}
  }
}

export {};
