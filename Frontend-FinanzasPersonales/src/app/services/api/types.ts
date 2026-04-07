export type BackendTransactionType = "ingreso" | "gasto";

export interface CreateTransactionPayload {
  type: BackendTransactionType;
  amount: number;
  date: string;
  description: string;
  category: string;
}
