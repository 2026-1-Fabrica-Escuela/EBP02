// ai.ts
import { request } from "./http";
import { extractMessage } from "./messages";

export interface AiRecommendationResponse {
  category: string;
  motivo: string;
  ahorroEstimado: number;
}

export async function getAiRecommendationsRequest(
  month: string,
  token?: string | null
): Promise<AiRecommendationResponse[]> {
  try {
    return await request<AiRecommendationResponse[]>(
      `/v1/recommendations/generate?month=${month}`,
      { method: "GET" },
      token
    );
  } catch (error) {
    throw new Error(extractMessage(error, "Error obteniendo recomendaciones"));
  }
}