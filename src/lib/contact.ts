/**
 * The contact form's rules, shared by the page and the Edge Function.
 *
 * One copy, synced to supabase/functions/_shared, so the browser can never accept a
 * message the server then refuses - or the other way round, which is worse: a form that
 * says "sendt" for something that was dropped.
 */
export const CONTACT_LIMITS = {
  title: { min: 3, max: 120 },
  message: { min: 10, max: 4000 },
  sender: { max: 200 },
} as const;

/** Messages one visitor may send per day before the form asks them to wait. */
export const CONTACT_PER_DAY = 5;

export type ContactInput = { title: string; message: string; sender: string };
export type ContactField = keyof ContactInput;
export type ContactCheck =
  | { ok: true; value: ContactInput }
  | { ok: false; errors: Partial<Record<ContactField, string>> };

// Deliberately loose: one @, something on each side, a dot in the domain. Stricter
// patterns reject real addresses (plus-tags, long TLDs, IDN) far more often than they
// catch typos, and the only use of this address is to reply to it.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trim, collapse the title to one line, and say what is wrong with each field. */
export function checkContact(raw: Partial<Record<ContactField, unknown>>): ContactCheck {
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  // A subject line with a newline in it is how header injection starts; the title is one
  // line whatever the browser sent.
  const title = str(raw.title).replace(/\s+/g, " ").trim();
  const message = str(raw.message).replace(/\r\n/g, "\n").trim();
  const sender = str(raw.sender).trim();

  const errors: Partial<Record<ContactField, string>> = {};
  if (title.length < CONTACT_LIMITS.title.min) errors.title = "Schreib einen kurzen Betreff.";
  else if (title.length > CONTACT_LIMITS.title.max) errors.title = `Der Betreff darf höchstens ${CONTACT_LIMITS.title.max} Zeichen lang sein.`;
  if (message.length < CONTACT_LIMITS.message.min) errors.message = "Die Nachricht ist etwas zu kurz.";
  else if (message.length > CONTACT_LIMITS.message.max) errors.message = `Die Nachricht darf höchstens ${CONTACT_LIMITS.message.max} Zeichen lang sein.`;
  if (!sender) errors.sender = "Gib deine E-Mail-Adresse an, damit wir antworten können.";
  else if (sender.length > CONTACT_LIMITS.sender.max || !EMAIL.test(sender)) errors.sender = "Das sieht nicht nach einer E-Mail-Adresse aus.";

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value: { title, message, sender } };
}
