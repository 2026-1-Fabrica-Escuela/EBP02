// types.ts
export type TransactionStatus = "PENDING" | "COMPLETED" | "CANCELLED";

export interface CreateTransactionPayload {
  categoryId: string;   // Debe ser el UUID de la categoría
  amount: number;       // BigDecimal en Java, number en TS
  date: string;         // ISO date "yyyy-MM-dd"
  description: string;
  status: TransactionStatus; // Obligatorio y validado por @Pattern en el Back
  pocketId?: string | null;  // Opcional
}