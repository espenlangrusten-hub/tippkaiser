import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "../supabase/functions/_shared/env";

declare global {
  var Deno: { env: { get(name: string): string | undefined } };
}

afterEach(() => vi.unstubAllGlobals());

describe("Quizkaiser secret isolation", () => {
  it("never borrows Tippetuppen's admin or email configuration", () => {
    const values: Record<string, string> = {
      ADMIN_KEY: "other-site-key", RESEND_API_KEY: "other-site-mail",
      CONTACT_TO: "other-site@example.test", SITE_URL: "https://example.test",
    };
    vi.stubGlobal("Deno", { env: { get: (name: string) => values[name] } });
    for (const name of Object.keys(values)) expect(env(name)).toBeUndefined();
  });
  it("reads only the dedicated Kaiser value", () => {
    const values: Record<string, string> = { ADMIN_KEY: "other", KAISER_ADMIN_KEY: "kaiser" };
    vi.stubGlobal("Deno", { env: { get: (name: string) => values[name] } });
    expect(env("ADMIN_KEY")).toBe("kaiser");
  });
});
