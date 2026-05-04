import { ENDPOINTS, USE_MOCK_API } from "./config";
import { request } from "./http";
import {
  mockCreatePocketRequest,
  mockDeletePocketRequest,
  mockGetPocketsByBudgetRequest,
  mockGetPocketsRequest,
} from "./mock-api";
import type { CreatePocketRequest } from "../../context/types";

export const getPocketsRequest = (token?: string | null) => {
  if (USE_MOCK_API) {
    return mockGetPocketsRequest(token);
  }

  return request<unknown>(ENDPOINTS.pockets, { method: "GET" }, token);
};

export const getPocketsByBudgetRequest = (budgetId: string, token?: string | null) => {
  if (USE_MOCK_API) {
    return mockGetPocketsByBudgetRequest(budgetId, token);
  }

  return request<unknown>(`${ENDPOINTS.pockets}/budget/${budgetId}`, { method: "GET" }, token);
};

export const createPocketRequest = (payload: CreatePocketRequest, token?: string | null) => {
  if (USE_MOCK_API) {
    return mockCreatePocketRequest(payload, token);
  }

  return request<unknown>(ENDPOINTS.pockets, {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
};

export const deletePocketRequest = (id: string, token?: string | null) => {
  if (USE_MOCK_API) {
    return mockDeletePocketRequest(id, token);
  }

  return request<unknown>(`${ENDPOINTS.pockets}/${id}`, { method: "DELETE" }, token);
};