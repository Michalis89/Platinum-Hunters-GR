import { render, screen } from "@testing-library/react";
import Home from "./page";
import "@testing-library/jest-dom";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe("Home Page", () => {
  it("renders the title", () => {
    render(<Home />);
    expect(screen.getByText("Platinum Hunters")).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(<Home />);
    expect(
      screen.getByText("Ανακάλυψε και κατάκτησε το επόμενο Platinum Trophy σου.")
    ).toBeInTheDocument();
  });

  it("renders the Start Hunting button with correct link", () => {
    render(<Home />);
    const startButton = screen.getByRole("link", { name: /Start Hunting 🎮/i });
    expect(startButton).toBeInTheDocument();
    expect(startButton).toHaveAttribute("href", "/pages/guide");
  });
});
