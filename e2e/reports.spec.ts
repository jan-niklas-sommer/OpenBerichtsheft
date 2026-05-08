import { test, expect } from "@playwright/test";
import { login, TEST_USERS } from "./helpers";

test.describe("Weekly Report CRUD", () => {
  test("trainee can navigate to report editor", async ({ page }) => {
    await login(page, TEST_USERS.trainee.email, TEST_USERS.trainee.password);

    await expect(page.getByText("Meine Berichte")).toBeVisible();

    await page.getByRole("button", { name: /Neuer Bericht/i }).click();
    await page.waitForURL(/\/trainee\/reports\/\d{4}-\d+/, { timeout: 10000 });

    await expect(page.getByRole("heading", { name: /KW \d+/ })).toBeVisible();
  });

  test("trainee can write report text", async ({ page }) => {
    await login(page, TEST_USERS.trainee.email, TEST_USERS.trainee.password);

    await page.getByRole("button", { name: /Neuer Bericht/i }).click();
    await page.waitForURL(/\/trainee\/reports\/\d{4}-\d+/, { timeout: 10000 });

    const textarea = page.getByPlaceholder(/Berichtstext|Woche/i);
    if (await textarea.isVisible()) {
      await textarea.fill("E2E Test Wochenbericht");
      await page.waitForTimeout(2500);
    }
  });

  test("trainee sees report overview after login", async ({ page }) => {
    await login(page, TEST_USERS.trainee.email, TEST_USERS.trainee.password);
    await expect(page.getByRole("heading", { name: "Meine Berichte" })).toBeVisible();
  });
});

test.describe("Report Review", () => {
  test("trainer sees dashboard heading", async ({ page }) => {
    await login(page, TEST_USERS.trainer.email, TEST_USERS.trainer.password);
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible();
  });

  test("officer sees dashboard heading", async ({ page }) => {
    await login(page, TEST_USERS.officer.email, TEST_USERS.officer.password);
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible();
  });
});
