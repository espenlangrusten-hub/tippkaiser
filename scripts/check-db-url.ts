/**
 * Check DATABASE_URL before anything touches the database, and say what is wrong in a
 * GitHub annotation the operator can read from the run summary.
 *
 * Nothing secret is printed: the password is described by its length and whether it
 * holds characters that must be percent-encoded in a URL, never by its value.
 *
 *   node --import tsx scripts/check-db-url.ts
 */
import postgres from "postgres";

const fail = (message: string): never => {
  console.log(`::error title=DATABASE_URL::${message}`);
  process.exit(1);
};

const raw = process.env.DATABASE_URL ?? "";
if (!raw) fail("DATABASE_URL er tom.");

let url: URL;
try {
  url = new URL(raw);
} catch {
  // The usual cause: a password with @, #, / or ? pasted into the URL without encoding.
  fail("DATABASE_URL er ikke en gyldig adresse. Har passordet tegn som @ # / ? %, må de URL-kodes (f.eks. @ → %40).");
}

const password = decodeURIComponent(url!.password);
const shape = [
  `vert=${url!.hostname}`,
  `port=${url!.port || "(ingen)"}`,
  `bruker=${decodeURIComponent(url!.username) || "(ingen)"}`,
  `database=${url!.pathname.replace(/^\//, "") || "(ingen)"}`,
  `passord=${password.length} tegn`,
  password.includes("[YOUR-PASSWORD]") || password === "YOUR-PASSWORD" ? "PASSORDET ER IKKE BYTTET UT" : "",
].filter(Boolean).join(", ");
console.log(`DATABASE_URL: ${shape}`);

if (url!.protocol !== "postgresql:" && url!.protocol !== "postgres:") fail(`Adressen må starte med postgresql://. ${shape}`);
if (!password) fail(`Passordet mangler i adressen. ${shape}`);
if (/YOUR-PASSWORD/.test(password)) fail(`[YOUR-PASSWORD] er ikke byttet ut med databasepassordet. ${shape}`);

const sql = postgres(raw, { max: 1, prepare: false, connect_timeout: 15 });
try {
  const [{ ok }] = await sql<{ ok: number }[]>`select 1 as ok`;
  console.log(`Tilkoblingen virker (svar ${ok}).`);
} catch (error) {
  const err = error as { code?: string; message?: string };
  // The driver's message names the host or the user, never the password; scrub it anyway.
  const message = (err.message ?? String(error)).split(password).join("***");
  // A host that is not Supabase's usually means a #, @, / or ? in the password cut the URL short.
  const hint = /supabase\.(com|co)$/.test(url!.hostname)
    ? ""
    : " Verten er ikke en Supabase-adresse: har passordet tegn som @ # / ?, må de URL-kodes (@ → %40, # → %23, / → %2F, ? → %3F).";
  fail(`Fikk ikke koblet til databasen: ${err.code ?? ""} ${message}. ${shape}.${hint}`);
} finally {
  await sql.end({ timeout: 5 });
}
