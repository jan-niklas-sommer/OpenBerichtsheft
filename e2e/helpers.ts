import { type Page } from "@playwright/test";

const TEST_USERS = {
  admin: { email: "admin@example.com", password: "password123", name: "Max Admin" },
  trainer: { email: "trainer@example.com", password: "password123", name: "Thomas Ausbilder" },
  officer: { email: "officer@example.com", password: "password123", name: "Sandra Beauftragte" },
  trainee: { email: "trainee@example.com", password: "password123", name: "Anna Azubi" },
  trainee2: { email: "trainee2@example.com", password: "password123", name: "Ben Azubi" },
};

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("E-Mail", { exact: true }).fill(email);
  await page.getByLabel("Passwort", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL(/\/(trainee|trainer|officer|admin)/);
}

export { login, TEST_USERS };
