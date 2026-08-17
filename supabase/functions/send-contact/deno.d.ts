declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

declare module "https://deno.land/std/http/server.ts" {
  export function serve(handler: (req: Request) => Promise<Response> | Response): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(url: string, key: string): {
    from: (table: string) => {
      insert: (rows: Record<string, unknown>[]) => Promise<{ error: unknown | null }>;
      delete: () => { eq: (field: string, value: unknown) => Promise<{ error: unknown | null }> };
      select: (columns?: string) => { eq: (field: string, value: unknown) => Promise<{ data: unknown[] | null; error: unknown | null }> };
    };
  };
}

declare module "https://esm.sh/resend@2.0.0" {
  export class Resend {
    constructor(apiKey: string);
    emails: {
      send(payload: Record<string, unknown>): Promise<{ id?: string; error?: unknown }>;
    };
  }
}
