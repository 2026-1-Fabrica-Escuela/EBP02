import { ENDPOINTS, USE_MOCK_API } from "./config";
import { request } from "./http";

export interface ReportApiResponse {
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  expenseByCategory: Record<string, number>;
  incomeByCategory: Record<string, number>;
  transactions: Array<{
    transactionId: string;
    amount: number;
    description: string;
    status: string;
    date: string;
    categoryTitle: string;
    categoryType: string;
    pocketTitle: string | null;
  }>;
}

export const getReportRequest = (
  start: string,
  end: string,
  token?: string | null,
) => {
  return request<ReportApiResponse>(
    `${ENDPOINTS.reports}?start=${start}&end=${end}`,
    { method: "GET" },
    token,
  );
};
