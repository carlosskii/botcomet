export { default as DualSet } from "./DualSet.js";
export * from "./Message.js";
export type { Context, ContextCache } from "./Context.js";

function next_obfuscated_id(): string {
  return Math.random().toString(36).substring(2);
}

export { next_obfuscated_id };
