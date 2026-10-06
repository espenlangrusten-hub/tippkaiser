import { test, expect } from "@playwright/test";

// MATCH is in the word list as a guess-only word, so it is accepted but never the answer.
test("Gullordet accepts a guess from the word list and survives reload", async ({ page }) => {
  await page.goto("/gullordet/");
  await expect(page.getByRole("heading", { level: 1, name: "Goldwort" })).toBeVisible();
  await expect(page.getByText("Fünf Buchstaben. Sechs Versuche.")).toBeVisible();

  for (const letter of ["M", "A", "T", "C", "H"]) {
    await page.getByRole("button", { name: letter, exact: true }).click();
  }
  await page.getByRole("button", { name: "Absenden", exact: true }).click();

  const first = page.locator('[aria-label^="Versuch 1:"]');
  await expect(first).toHaveAttribute("aria-label", "Versuch 1: MATCH", { timeout: 10000 });
  await expect(first.locator("div")).toHaveCount(5);

  await page.reload();
  await expect(page.locator('[aria-label="Versuch 1: MATCH"]')).toBeVisible({ timeout: 10000 });

  await page.getByRole("button", { name: "So spielst du Goldwort" }).click();
  await expect(page.getByRole("dialog", { name: "So wird gespielt" })).toBeVisible();
  await page.getByRole("button", { name: "Schließen" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
