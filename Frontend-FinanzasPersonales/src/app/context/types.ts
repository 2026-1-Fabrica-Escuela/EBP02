export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

export interface Transaction {
  id: string;
  type: "ingreso" | "gasto";
  amount: number;
  date: string;
  description: string;
  category: string;
  userId: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
}

export interface AuthActionResult extends ActionResult {
  user?: User;
}

export interface AppState {
  user: User | null;
  users: User[];
  transactions: Transaction[];
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<AuthActionResult>;
  register: (name: string, email: string, password: string) => Promise<AuthActionResult>;
  requestPasswordReset: (email: string) => Promise<ActionResult>;
  logout: () => Promise<void>;
addTransaction: (transactionData: CreateTransactionPayload) => Promise<ActionResult>;  refreshData: () => Promise<void>;
}

// En types.ts
export interface CreateTransactionPayload {
  categoryId: string;
  amount: number;
  date: string;
  description: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  pocketId?: string | null;
}