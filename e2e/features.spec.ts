import { test, expect } from "@playwright/test";
import { login, TEST_USERS } from "./helpers";

test.describe("Admin Functions", () => {
  test("admin can view user list", async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);

    await page.getByRole("link", { name: "Benutzer" }).click();
    await page.waitForURL(/\/admin\/users/);

    await expect(page.getByText(/Admin|Ausbilder|Auszubildende/i)).toBeVisible();
  });

  test("admin can view professions", async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);

    await page.getByRole("link", { name: "Berufe" }).click();
    await page.waitForURL(/\/admin\/professions/);

    await expect(page.getByText("Fachinformatiker für Anwendungsentwicklung")).toBeVisible();
  });

  test("admin can view progress dashboard", async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);

    await page.getByRole("link", { name: "Fortschritt" }).click();
    await page.waitForURL(/\/admin\/progress/);

    await expect(page.getByText(/Fortschritt|Azubi/i)).toBeVisible();
  });

  test("admin can view assignments", async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);

    await page.getByRole("link", { name: "Zuordnungen" }).click();
    await page.waitForURL(/\/admin\/assignments/);

    await expect(page.getByText(/Zuordnung|Zuordnungen/i).first()).toBeVisible();
  });
});

test.describe("Theme Toggle", () => {
  test("theme toggle changes mode", async ({ page }) => {
    await login(page, TEST_USERS.trainee.email, TEST_USERS.trainee.password);

    const html = page.locator("html");
    const before = await html.getAttribute("class") || "";

    const themeBtn = page.locator("button[aria-label], button").filter({ hasText: /theme|dark|light/i });
    if (await themeBtn.count() > 0) {
      await themeBtn.first().click();
      const after = await html.getAttribute("class") || "";
      expect(after).not.toBe(before);
    }
  });
});
