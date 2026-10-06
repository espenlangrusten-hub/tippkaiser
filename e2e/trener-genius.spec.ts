import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

// Test-only oracle. Answers must never be imported by the client application.
const bank = JSON.parse(readFileSync("data/source/trenerquiz.json", "utf8")) as {prompt:string;answer:{label:string}}[];
const api = process.env.E2E_API_URL ?? "http://localhost:8000/api";

test("Trener Genius persists a round, guards answers and awards league points once", async ({page, request}, info) => {
  const registration = await request.post(`${api}/auth/register`, {data:{username:`genius-${Date.now()}`,password:"local-test-password"}});
  const session = await registration.json();
  expect(session.ok).toBe(true);
  const headers = {"x-session-token":session.token};
  await page.goto("/");
  await page.evaluate(({token,user}) => {localStorage.setItem("tk-session",token);localStorage.setItem("tk-user",JSON.stringify(user));},session);
  await expect(page.getByRole("link",{name:"Trainer-Genie spielen",exact:true})).toBeVisible();
  await page.screenshot({path:`e2e/screenshots/genius-home-${info.project.name}.png`,fullPage:true});
  await page.getByRole("link",{name:"Trainer-Genie spielen",exact:true}).click();
  const start = await (await request.post(`${api}/trener-genius/start`,{headers,data:{}})).json();
  expect(start.reveal).toBeNull();
  expect(JSON.stringify(start)).not.toContain("answerIndex");
  const attack = await request.post(`${api}/trener-genius/answer`,{data:{attemptId:start.attemptId,index:0,option:0}});
  expect(attack.status()).toBe(404);
  await expect(page.getByRole("group",{name:"Svaralternativer"})).toBeVisible();
  await page.screenshot({path:`e2e/screenshots/genius-game-${info.project.name}.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (let index=0;index<4;index++) {
    const current = await (await request.post(`${api}/trener-genius/start`,{headers,data:{}})).json();
    expect(current.attemptId).toBe(start.attemptId);
    expect(current.index).toBe(index);
    const correct = bank.find(q=>q.prompt===current.question.prompt)!.answer.label;
    if(index===0) await page.getByRole("button",{name:/Offensiv gehen/}).click();
    if(index===1) {
      await page.getByRole("button",{name:/50\/50-Joker/}).click();
      await expect(page.getByRole("button",{name:/50\/50 genutzt/})).toBeDisabled();
    }
    // Whole-label match: a substring filter picks "Notodden" as well as "Odd".
    const exactly = new RegExp(`^[A-D] ${correct.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}$`);
    await page.getByRole("group",{name:"Svaralternativer"}).getByRole("button",{name:exactly}).click();
    await page.getByRole("button",{name:/(Offensive Antwort|Antwort) festlegen/}).click();
    await expect(page.getByRole("button",{name:index===3?/Ergebnis ansehen/:/Nächste Frage/})).toBeVisible();
    const replay = await (await request.post(`${api}/trener-genius/answer`,{headers,data:{attemptId:start.attemptId,index,option:0}})).json();
    expect(replay.answers).toHaveLength(index+1);
    await page.reload();
    await expect(page.getByRole("button",{name:index===3?/Ergebnis ansehen/:/Nächste Frage/})).toBeVisible();
    // The click only sends /next; wait for the server to record it before the next
    // iteration asks /start for the index, or the two race and /start can still say the old one.
    const advanced = page.waitForResponse((r) => r.url().endsWith("/trener-genius/next") && r.request().method() === "POST");
    await page.getByRole("button",{name:index===3?/Ergebnis ansehen/:/Nächste Frage/}).click();
    expect((await advanced).ok()).toBe(true);
  }
  await expect(page.getByRole("button",{name:"Ergebnis teilen ↗"})).toBeVisible();
  await expect(page.getByText("Die Punkte sind in der Monatsliga eingetragen.")).toBeVisible();
  const final = await (await request.post(`${api}/trener-genius/start`,{headers,data:{}})).json();
  expect(final.total).toBe(110);
  expect(final.points).toBe(100);
  expect(final.phase).toBe("done");
  const board = await (await request.get(`${api}/leaderboard`,{headers})).json();
  expect(board.me.points).toBe(100);
  expect(board.me.played).toBe(1);
  await page.goto("/");
  await expect(page.getByRole("link",{name:"Ergebnis für Trainer-Genie ansehen",exact:true})).toContainText("Erledigt");
});
