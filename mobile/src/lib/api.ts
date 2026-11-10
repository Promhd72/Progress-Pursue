import { supabase } from "@/integrations/supabase/client";

/**
 * Small stand-in for the old server-function API. Each "function" now runs in
 * the app and talks to Supabase as the signed-in user; row-level security and
 * the database functions in supabase/migrations enforce the rules.
 */
export type ApiContext = { supabase: typeof supabase; userId: string };

type Handler<I, O> = (args: { data: I; context: ApiContext }) => Promise<O>;

class FnBuilder<I> {
  constructor(private readonly validate: (d: unknown) => I) {}

  inputValidator<J>(validate: (d: never) => J): FnBuilder<J> {
    return new FnBuilder<J>(validate as (d: unknown) => J);
  }

  handler<O>(handler: Handler<I, O>) {
    const validate = this.validate;
    return async (opts?: { data?: unknown }): Promise<O> => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      if (!userId) throw new Error("You're signed out. Please sign in again.");
      return handler({ data: validate(opts?.data), context: { supabase, userId } });
    };
  }
}

export function serverFn() {
  return new FnBuilder<undefined>(() => undefined);
}

/** Kept so screens can keep calling `useServerFn(fn)`. */
export function useServerFn<T>(fn: T): T {
  return fn;
}

/** Calls a database function and unwraps errors into readable messages. */
export async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  // The generated types don't know about our functions yet; keep the call loose.
  const { data, error } = await (
    supabase.rpc as unknown as (
      n: string,
      a: Record<string, unknown>,
    ) => Promise<{ data: T; error: { message: string } | null }>
  )(name, args);
  if (error) throw new Error(error.message);
  return data;
}
