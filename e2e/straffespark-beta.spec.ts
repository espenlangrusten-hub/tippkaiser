import { test, expect } from "@playwright/test";

test("daily Elfmeter plays exactly five questions and restarts the same daily round", async ({ page }) => {
  await page.goto("/straffespark/");
  await expect(page.getByText("Runde des Tages", { exact: true })).toBeVisible();
  await expect(page.getByText(/Dieselbe Frage kommt frühestens nach 100 Tagen wieder/)).toBeVisible();

  const prompts: string[] = [];
  for (let i = 0; i < 5; i++) {
    await expect(page.getByText(new RegExp(`Frage ${i + 1} von 5`))).toBeVisible();
    const prompt = ((await page.getByRole("heading", { level: 2 }).textContent()) ?? "").trim();
    expect(prompt.length).toBeGreaterThan(0);
    prompts.push(prompt);

    await expect(page.getByLabel("Deine Antwort")).toHaveCount(1);
    await page.getByRole("button", { name: "Überspringen" }).click();
    await expect(page.getByText("Verschossen!", { exact: true })).toBeVisible();
    await expect(page.getByText("Richtige Antwort:", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: i === 4 ? "Ergebnis ansehen" : "Nächste Frage" }).click();
  }

  expect(new Set(prompts).size).toBe(5);
  await expect(page.getByRole("heading", { name: "Du hast 0 von 5 verwandelt!" })).toBeVisible();

  await page.getByRole("button", { name: "Runde des Tages noch einmal spielen" }).click();
  await expect(page.getByRole("heading", { level: 2 })).toHaveText(prompts[0]);
});

test("home presents Elfmeter as a daily game after Finde den Spieler", async ({ page }) => {
  await page.goto("/");
  const cards = await page.getByRole("region", { name: "Spiele des Tages" }).getByRole("heading", { level: 2 }).allTextContents();
  expect(cards).toHaveLength(6);
  // Six cards of one size: no card is stretched across the row.
  const widths = await page.getByRole("region", { name: "Spiele des Tages" }).getByRole("link").filter({ has: page.getByRole("heading", { level: 2 }) }).evaluateAll((links) => links.map((l) => Math.round(l.getBoundingClientRect().width)));
  expect(widths).toHaveLength(6);
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
  expect(cards.findIndex((s) => s.includes("Finde den Spieler"))).toBeGreaterThanOrEqual(0);
  expect(cards.findIndex((s) => s.includes("Elfmeter"))).toBeGreaterThan(cards.findIndex((s) => s.includes("Finde den Spieler")));
  expect(cards.some((s) => s.includes("Goldwort"))).toBe(true);
  await expect(page.getByRole("link", { name: "Elfmeter spielen, die 5 des Tages", exact: true })).toHaveAttribute("href", /\/straffespark\//);
  await expect(page.getByText("Fünf neue Fragen jeden Tag.", { exact: true })).toBeVisible();
});
