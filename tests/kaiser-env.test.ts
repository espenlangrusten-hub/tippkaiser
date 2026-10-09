import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "../supabase/functions/_shared/env";

declare global {
  var Deno: { env: { get(name: string): string | undefined } };
}

afterEach(() => vi.unstubAllGlobals());

describe("Quizkaiser secret isolation", () => {
  it("never borrows Tippetuppen's admin key, sender or site configuration", () => {
    const values: Record<string, string> = {
      ADMIN_KEY: "other-site-key", CONTACT_FROM: "Other <x@example.test>", SITE_URL: "https://example.test",
    };
    vi.stubGlobal("Deno", { env: { get: (name: string) => values[name] } });
    for (const name of Object.keys(values)) expect(env(name)).toBeUndefined();
  });
  it("shares only the admin recipient and Resend key, preferring Kaiser values", () => {
    const values: Record<string, string> = { CONTACT_TO: "shared@example.test", RESEND_API_KEY: "shared-key" };
    vi.stubGlobal("Deno", { env: { get: (name: string) => values[name] } });
    expect(env("CONTACT_TO")).toBe("shared@example.test");
    expect(env("RESEND_API_KEY")).toBe("shared-key");
    values.KAISER_CONTACT_TO = "kaiser@example.test";
    expect(env("CONTACT_TO")).toBe("kaiser@example.test");
  });
  it("reads only the dedicated Kaiser value", () => {
    const values: Record<string, string> = { ADMIN_KEY: "other", KAISER_ADMIN_KEY: "kaiser" };
    vi.stubGlobal("Deno", { env: { get: (name: string) => values[name] } });
    expect(env("ADMIN_KEY")).toBe("kaiser");
  });
});
