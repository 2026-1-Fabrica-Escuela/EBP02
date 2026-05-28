import { ENDPOINTS, USE_MOCK_API } from "./config";
import { request } from "./http";
import {
  mockAddTransactionRequest,
  mockGetTransactionsRequest,
} from "./mock-api";
import type { CreateTransactionPayload } from "./types";

export const getTransactionsRequest = (token?: string | null) => {
  if (USE_MOCK_API) {
    return mockGetTransactionsRequest(token);
  }

  return request<unknown>(ENDPOINTS.transactions, { method: "GET" }, token);
};

export const getTransactionsByPeriodRequest = (
  start: string,
  end: string,
  token?: string | null,
) => {
  return request<unknown>(
    `${ENDPOINTS.transactions}/period?start=${start}&end=${end}`,
    { method: "GET" },
    token,
  );
};

export const addTransactionRequest = (
  payload: CreateTransactionPayload,
  token?: string | null,
) => {
  if (USE_MOCK_API) {
    return mockAddTransactionRequest(payload, token);
  }

  return request<unknown>(ENDPOINTS.transactions, {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
};
