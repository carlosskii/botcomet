
interface Context {
  type: string;
  data: any;
}

type ContextCache = Map<string, Context>;

export type { Context, ContextCache };
