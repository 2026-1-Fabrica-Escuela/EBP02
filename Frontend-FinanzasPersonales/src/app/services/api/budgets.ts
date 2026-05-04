import { ENDPOINTS, USE_MOCK_API } from "./config";
import { request } from "./http";
import {
  mockCreateBudgetRequest,
  mockGetBudgetByMonthYearRequest,
  mockGetBudgetsRequest,
  mockUpdateBudgetRequest,
} from "./mock-api";
import type { CreateBudgetRequest, UpdateBudgetRequest } from "../../context/types";

export const getBudgetsRequest = (token?: string | null) => {
  if (USE_MOCK_API) {
    return mockGetBudgetsRequest(token);
  }

  return request<unknown>(ENDPOINTS.budgets, { method: "GET" }, token);
};

export const getBudgetByMonthYearRequest = (
  month: number,
  year: number,
  token?: string | null,
) => {
  if (USE_MOCK_API) {
    return mockGetBudgetByMonthYearRequest(month, year, token);
  }

  return request<unknown>(`${ENDPOINTS.budgets}/${month}/${year}`, { method: "GET" }, token);
};

export const createBudgetRequest = (payload: CreateBudgetRequest, token?: string | null) => {
  if (USE_MOCK_API) {
    return mockCreateBudgetRequest(payload, token);
  }

  return request<unknown>(ENDPOINTS.budgets, {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
};

export const updateBudgetRequest = (
  id: string,
  payload: UpdateBudgetRequest,
  token?: string | null,
) => {
  if (USE_MOCK_API) {
    return mockUpdateBudgetRequest(id, payload, token);
  }

  return request<unknown>(`${ENDPOINTS.budgets}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }, token);
};