/**
 * App secrets are read with the KAISER_ prefix and must not fall back to another function's
 * project-wide secrets, with one narrow exception: the admin mail recipient and the Resend key.
 * Espen decided Quizkaiser mail goes to the same admin address as Tippetuppen (same Supabase
 * project), so CONTACT_TO and RESEND_API_KEY fall back to the unprefixed project secrets when the
 * KAISER_ variant is missing. CONTACT_FROM deliberately does not fall back (it carries
 * Tippetuppen's sender name).
 */
const SHARED_FALLBACK = new Set(["CONTACT_TO", "RESEND_API_KEY"]);

export function env(name: string): string | undefined {
  const own = Deno.env.get(`KAISER_${name}`);
  if (own) return own;
  if (SHARED_FALLBACK.has(name)) return Deno.env.get(name) || undefined;
  return undefined;
}
