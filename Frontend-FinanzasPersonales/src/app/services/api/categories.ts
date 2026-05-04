import { ENDPOINTS, USE_MOCK_API } from "./config";
import { request } from "./http";
import { mockGetCategoriesRequest } from "./mock-api";
import type { CategoryResponse, CategoryType } from "./types";

export const getCategoriesRequest = (
  token?: string | null,
  type?: CategoryType,
): Promise<CategoryResponse[]> => {
  if (USE_MOCK_API) {
    return mockGetCategoriesRequest(token, type);
  }

  const endpoint = type
    ? `${ENDPOINTS.categories}/type/${encodeURIComponent(type)}`
    : ENDPOINTS.categories;

  return request<CategoryResponse[]>(endpoint, { method: "GET" }, token);
};