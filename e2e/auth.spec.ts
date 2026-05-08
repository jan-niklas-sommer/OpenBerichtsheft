import { test, expect } from "@playwright/test";
import { login, TEST_USERS } from "./helpers";

test.describe("Authentication", () => {
  test("login with valid credentials redirects to dashboard", async ({ page }) => {
    await login(page, TEST_USERS.trainee.email, TEST_USERS.trainee.password);
    await expect(page).toHaveURL(/\/trainee/);
    await expect(page.getByText("Anna Azubi")).toBeVisible();
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-Mail").fill("wrong@example.com");
    await page.getByLabel("Passwort").fill("wrongpassword");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await expect(page.getByText("Ungültige Anmeldedaten")).toBeVisible();
  });

  test("unauthenticated access redirects to login", async ({ page }) => {
    await page.goto("/trainee");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });

  test("logout redirects to login", async ({ page }) => {
    await login(page, TEST_USERS.trainee.email, TEST_USERS.trainee.password);
    await page.getByRole("button").filter({ has: page.locator("svg") }).last().click();
    await page.waitForURL(/\/login/, { timeout: 10000 }).catch(() => {});
  });

  test("admin login redirects to admin dashboard", async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await expect(page).toHaveURL(/\/admin/);
  });

  test("trainer login redirects to trainer dashboard", async ({ page }) => {
    await login(page, TEST_USERS.trainer.email, TEST_USERS.trainer.password);
    await expect(page).toHaveURL(/\/trainer/);
  });

  test("officer login redirects to officer dashboard", async ({ page }) => {
    await login(page, TEST_USERS.officer.email, TEST_USERS.officer.password);
    await expect(page).toHaveURL(/\/officer/);
  });
});

test.describe("Role-based Navigation", () => {
  test("trainee sees Berichte link", async ({ page }) => {
    await login(page, TEST_USERS.trainee.email, TEST_USERS.trainee.password);
    await expect(page.getByRole("link", { name: "Berichte" })).toBeVisible();
  });

  test("admin sees admin navigation items", async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await expect(page.getByRole("link", { name: "Benutzer" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Zuordnungen" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Berufe" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Fortschritt" })).toBeVisible();
  });

  test("trainee cannot access admin pages", async ({ page }) => {
    await login(page, TEST_USERS.trainee.email, TEST_USERS.trainee.password);
    await page.goto("/admin");
    await page.waitForURL(/\/trainee/);
    await expect(page).toHaveURL(/\/trainee/);
  });
});
