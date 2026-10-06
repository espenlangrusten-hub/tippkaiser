import { test, expect } from "@playwright/test";

// The history used to show only the last two rows, so from the third attempt on you
// could no longer see which letters you had already ruled out.
test("every attempt stays visible, not just the last two", async ({ page }, info) => {
  await page.goto("/mangler-xi/");
  await page.getByRole("button", { name: "Los geht’s!" }).click({ timeout: 6000 }).catch(() => {});

  // Shirts are laid out by pitch row, not by payload order, so address one by its label.
  await page.locator("button[aria-label^='Trikot']").first().click();
  const input = page.locator("[aria-label='Dein Versuch']");
  await expect(input).toBeVisible();
  const len = await input.locator(".tile:not(.tile-space)").count();
  expect(len).toBeGreaterThan(3);

  for (const letter of ["Q", "W", "X", "Z", "V"]) {
    for (let i = 0; i < len; i++) await page.keyboard.press(letter);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
  }

  await expect(page.locator("text=/Versuch 6\\/6/")).toBeVisible();
  await expect(page.locator("[aria-label^='Versuch: ']")).toHaveCount(5);
  // The keyboard must still be reachable with a full history above it.
  await expect(page.getByRole("button", { name: "Absenden" })).toBeInViewport();
  await page.screenshot({ path: `e2e/screenshots/history-${info.project.name}.png` });
});
