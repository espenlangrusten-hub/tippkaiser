import { test, expect } from "@playwright/test";

function uniqueStem(project: string) {
  return ("social-" + project + "-" + Date.now().toString(36)).replace(/[^a-z0-9-]/gi, "").slice(0, 20);
}

test("profile and friend-league flow works end-to-end", async ({ page }, testInfo) => {
  const stem = uniqueStem(testInfo.project.name);
  const owner = stem + "-a";
  const friend = stem + "-b";
  const password = "Tippetuppen-123!";
  const leagueName = "Testgjengen " + testInfo.project.name;

  await page.goto("/profil/#register");
  await expect(page.getByRole("heading", { name: "Mein Profil" })).toBeVisible();

  await page.getByLabel("Benutzername").fill(owner);
  await page.getByLabel("Passwort").fill(password);
  await page.getByRole("button", { name: "Spieler anlegen" }).click();

  await expect(page.getByText("Spieler angelegt.")).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(/Der Profilavatar wird bei 2.000 Gesamtpunkten freigeschaltet/)).toBeVisible();

  await page.getByLabel("Name", { exact: true }).fill("Test Spiller");
  await page.getByLabel("E-Mail-Adresse", { exact: true }).fill(owner + "@example.test");
  await page.getByRole("button", { name: "Profil speichern" }).click();
  await expect(page.getByText("Das Profil wurde gespeichert.")).toBeVisible({ timeout: 10000 });

  await page.reload();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Test Spiller");
  await expect(page.getByLabel("E-Mail-Adresse", { exact: true })).toHaveValue(owner + "@example.test");

  await page.goto("/liga/");
  await page.getByRole("button", { name: "Freundesligen" }).click();
  await page.getByPlaceholder("Z. B. Bolzplatz-Legenden").fill(leagueName);
  await page.getByRole("button", { name: "Liga gründen" }).click();

  await expect(page.getByText("Freundesliga gegründet. Teile den Code oder den Einladungslink mit deinen Freunden.")).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("heading", { name: leagueName })).toBeVisible();

  const codeNode = page.getByText(/^[A-HJ-NP-Z2-9]{6}$/, { exact: true }).first();
  await expect(codeNode).toBeVisible();
  const code = ((await codeNode.textContent()) ?? "").trim();
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);

  // Leave the owner account, then follow the same invite flow a real friend gets:
  // invitation -> profile creation -> automatic return to the league join screen.
  await page.goto("/profil/");
  await page.getByRole("button", { name: "Abmelden" }).click();

  await page.goto("/liga/?join=" + code);
  await expect(page.getByText(/Du brauchst ein Quizkaiser-Profil/)).toBeVisible();
  await page.getByRole("link", { name: "Profil anlegen" }).click();

  await expect(page).toHaveURL(new RegExp("/profil/\\?join=" + code + "#register$"));
  await page.getByLabel("Benutzername").fill(friend);
  await page.getByLabel("Passwort").fill(password);
  await page.getByRole("button", { name: "Spieler anlegen" }).click();

  await expect(page).toHaveURL(new RegExp("/liga/\\?join=" + code + "$"), { timeout: 10000 });
  await page.getByRole("button", { name: "Liga beitreten" }).click();

  await expect(page.getByText("Du bist jetzt in " + leagueName + ".")).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("heading", { name: leagueName })).toBeVisible();

  const table = page.locator("table").last();
  await expect(table.getByText(owner, { exact: true })).toBeVisible();
  await expect(table.getByText(friend, { exact: true })).toBeVisible();
  await expect(table.getByRole("row")).toHaveCount(3); // header + two players

  await page.screenshot({
    path: `e2e/screenshots/profile-social-${testInfo.project.name}.png`,
    fullPage: true,
  });
});

test("an offensive username is refused at registration", async ({ page }) => {
  await page.goto("/profil/#register");
  await page.getByLabel("Benutzername").fill("Fuuuck_" + Date.now().toString(36).slice(-4));
  await page.getByLabel("Passwort").fill("Tippetuppen-123!");
  await page.getByRole("button", { name: "Spieler anlegen" }).click();
  await expect(page.getByText("Dieser Benutzername ist nicht erlaubt. Wähle einen anderen.")).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("Spieler angelegt.")).toHaveCount(0);
});
