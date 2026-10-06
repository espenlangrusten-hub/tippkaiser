import { test, expect } from "@playwright/test";

test("Gullordet accepts an ordinary German five-letter guess and survives reload", async ({ page }) => {
  await page.goto("/gullordet/");
  await expect(page.getByRole("heading", { level: 1, name: "Goldwort" })).toBeVisible();
  await expect(page.getByText("Fünf Buchstaben. Sechs Versuche.")).toBeVisible();

  for (const letter of ["S", "U", "P", "E", "R"]) {
    await page.getByRole("button", { name: letter, exact: true }).click();
  }
  await page.getByRole("button", { name: "Absenden", exact: true }).click();

  const first = page.locator('[aria-label^="Versuch 1:"]');
  await expect(first).toHaveAttribute("aria-label", "Versuch 1: SUPER", { timeout: 10000 });
  await expect(first.locator("div")).toHaveCount(5);

  await page.reload();
  await expect(page.locator('[aria-label="Versuch 1: SUPER"]')).toBeVisible({ timeout: 10000 });

  await page.getByRole("button", { name: "So spielst du Goldwort" }).click();
  await expect(page.getByRole("dialog", { name: "So wird gespielt" })).toBeVisible();
  await page.getByRole("button", { name: "Schließen" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
