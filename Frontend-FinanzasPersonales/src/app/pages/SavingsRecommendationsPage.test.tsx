import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SavingsRecommendationsPage } from "./SavingsRecommendationsPage";
import { useApp } from "../context/AppContext";
import { getAiRecommendationsRequest } from "../services/api/ai";

// Mock the AppContext
vi.mock("../context/AppContext", () => ({
  useApp: vi.fn(),
}));

// Mock the AI service
vi.mock("../services/api/ai", () => ({
  getAiRecommendationsRequest: vi.fn(),
}));

describe("SavingsRecommendationsPage", () => {
  const mockUser = { id: "1", name: "Test User", email: "test@example.com", role: "user" };
  const mockTransactions = [];

  beforeEach(() => {
    vi.clearAllMocks();
    (useApp as any).mockReturnValue({
      user: mockUser,
      transactions: mockTransactions,
    });
  });

  it("renders correctly with initial state", () => {
    render(<SavingsRecommendationsPage />);
    expect(screen.getByText("Recomendaciones Personales")).toBeInTheDocument();
    expect(screen.getByText(/Selecciona un mes y haz clic en "Generar recomendaciones"/i)).toBeInTheDocument();
  });

  it("shows error when clicking generate without selecting a month", async () => {
    render(<SavingsRecommendationsPage />);
    const button = screen.getByText("Generar recomendaciones");
    fireEvent.click(button);
    expect(screen.getByText("Debes seleccionar un mes para generar recomendaciones.")).toBeInTheDocument();
  });

  it("generates and displays recommendations successfully", async () => {
    const mockRecs = [
      { category: "Alimentación", motivo: "Gasta menos en pizza", ahorroEstimado: 50000 },
    ];
    (getAiRecommendationsRequest as any).mockResolvedValue(mockRecs);

    render(<SavingsRecommendationsPage />);
    
    const select = screen.getByLabelText(/Mes/i);
    fireEvent.change(select, { target: { value: "2026-05" } });

    const button = screen.getByText("Generar recomendaciones");
    fireEvent.click(button);

    expect(await screen.findByText("Generando...")).toBeInTheDocument();

    expect(await screen.findByText("Alimentación")).toBeInTheDocument();
    expect(screen.getByText("Gasta menos en pizza")).toBeInTheDocument();
    // Use a regex for currency as formatting might vary slightly (e.g. non-breaking spaces)
    expect(screen.getByText(/\$?\s?50\.000/)).toBeInTheDocument();
  });

  it("handles empty data response", async () => {
    (getAiRecommendationsRequest as any).mockResolvedValue([]);

    render(<SavingsRecommendationsPage />);
    
    const select = screen.getByTestId("fluent-select");
    fireEvent.change(select, { target: { value: "2026-05" } });

    const button = screen.getByText("Generar recomendaciones");
    fireEvent.click(button);

    expect(await screen.findByText("Datos insuficientes")).toBeInTheDocument();
  });

  it("handles API error", async () => {
    (getAiRecommendationsRequest as any).mockRejectedValue(new Error("API Error"));

    render(<SavingsRecommendationsPage />);
    
    const select = screen.getByTestId("fluent-select");
    fireEvent.change(select, { target: { value: "2026-05" } });

    const button = screen.getByText("Generar recomendaciones");
    fireEvent.click(button);

    // According to logic, it shows "Datos insuficientes" on error too
    expect(await screen.findByText("Datos insuficientes")).toBeInTheDocument();
  });
});
