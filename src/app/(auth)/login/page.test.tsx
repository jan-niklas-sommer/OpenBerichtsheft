import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

const { signIn } = await import("next-auth/react");

function renderPage() {
  return render(<LoginPage />);
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(signIn).mockResolvedValue({
      error: "CredentialsSignin",
      code: "credentials",
      status: 401,
      ok: false,
      url: null,
    });
  });

  it("renders brand lockup and login form", () => {
    renderPage();
    expect(screen.getByText("OpenBerichtsheft")).toBeInTheDocument();
    expect(screen.getByText("Digitale Ausbildungsdokumentation")).toBeInTheDocument();
    expect(screen.getByLabelText("E-Mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Passwort")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Anmelden" }),
    ).toBeInTheDocument();
  });

  it("renders register link", () => {
    renderPage();
    const link = screen.getByRole("link", { name: "Jetzt registrieren" });
    expect(link).toHaveAttribute("href", "/register");
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    renderPage();
    const passwordInput = screen.getByLabelText("Passwort");
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(
      screen.getByRole("button", { name: "Passwort anzeigen" }),
    );
    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(
      screen.getByRole("button", { name: "Passwort verbergen" }),
    );
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("shows error alert on invalid credentials", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("E-Mail"), "a@b.de");
    await user.type(screen.getByLabelText("Passwort"), "wrongpass");
    await user.click(screen.getByRole("button", { name: "Anmelden" }));

    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "a@b.de",
      password: "wrongpass",
      redirect: false,
    });
    expect(await screen.findByText("Ungültige Anmeldedaten")).toBeInTheDocument();
  });

  it("disables submit button while loading", async () => {
    vi.mocked(signIn).mockImplementation(
      () => new Promise(() => undefined),
    );
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("E-Mail"), "a@b.de");
    await user.type(screen.getByLabelText("Passwort"), "12345678");
    await user.click(screen.getByRole("button", { name: "Anmelden" }));

    expect(
      screen.getByRole("button", { name: "Anmelden" }),
    ).toBeDisabled();
  });
});
