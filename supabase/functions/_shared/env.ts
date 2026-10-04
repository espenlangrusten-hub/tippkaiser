/**
 * Supabase secrets are shared by every function in a project, and Tippkaiser may run in
 * the same project as Tippetuppen. A KAISER_-prefixed secret therefore wins over the
 * shared one, so this site can have its own admin key, site URL and sender without
 * touching Tippetuppen's. The shared name is the fallback (local dev and CI use it).
 */
export function env(name: string): string | undefined {
  return Deno.env.get(`KAISER_${name}`) || Deno.env.get(name) || undefined;
}
