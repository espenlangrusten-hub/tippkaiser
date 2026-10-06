import { test, expect } from "@playwright/test";

// A wrong guess used to end the round on the spot, so guessing on the first hint was a
// gamble for the whole day. It should buy the next hint and cost part of the pot instead.
test("a wrong guess opens the next hint instead of ending the round", async ({ page }, info) => {
  await page.goto("/finn-spilleren/");

  const hints = page.locator("ol li");
  await expect(hints.first()).toBeVisible({ timeout: 10000 });
  await expect(hints).toHaveCount(1);
  await expect(page.locator("text=/Richtig jetzt gibt 100 Punkte/")).toBeVisible();

  const input = page.getByLabel("Name des Spielers");
  await input.fill("Definitivt Ikke Spilleren");
  await page.getByRole("button", { name: "Antworten" }).click();

  // Second hint, lower pot, round still open, and the field cleared for another go.
  await expect(hints).toHaveCount(2);
  await expect(page.locator("text=/Richtig jetzt gibt 80 Punkte/")).toBeVisible();
  await expect(input).toHaveValue("");
  await expect(page.locator("text=Definitivt Ikke Spilleren")).toBeVisible();
  await expect(page.getByRole("button", { name: "Antworten" })).toBeVisible();

  await page.screenshot({ path: `e2e/screenshots/finn-wrong-guess-${info.project.name}.png` });
});

test("the round ends once the last hint has been guessed away", async ({ page }) => {
  await page.goto("/finn-spilleren/");
  const input = page.getByLabel("Name des Spielers");
  await expect(input).toBeVisible({ timeout: 10000 });

  for (let i = 0; i < 5; i++) {
    await input.fill(`Feil svar nummer ${i + 1}`);
    await page.getByRole("button", { name: "Antworten" }).click();
    await page.waitForTimeout(400);
  }

  await expect(page.locator("text=Alle Hinweise sind verbraucht")).toBeVisible();
  await expect(page.getByRole("button", { name: "Antworten" })).toHaveCount(0);
});
