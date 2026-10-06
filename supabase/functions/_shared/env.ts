/** App secrets must never fall back to another function's project-wide secrets. */
export function env(name: string): string | undefined {
  return Deno.env.get(`KAISER_${name}`) || undefined;
}
