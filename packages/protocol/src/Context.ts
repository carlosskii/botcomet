import type { MessageType } from "./Message.js";

interface Context {
  type: MessageType;
  data: any;
}

type ContextCache = Map<string, Context>;

export type { Context, ContextCache };
